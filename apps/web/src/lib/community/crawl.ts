import { createHash } from 'crypto';
import Parser from 'rss-parser';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';

// 커뮤니티 크롤 코어 — 스케줄/수동 트리거가 공유한다.
// 명세: docs/pages/community/community-feed.md (크롤러 명세)
// 법적 가드레일: RSS/공식 피드의 메타데이터(제목·링크·발췌·OG이미지 URL)만 저장.
//   원문 본문 전문/이미지를 복제·재호스팅하지 않는다. 클릭 시 원문으로 링크아웃.

const MAX_ITEMS_PER_SOURCE = 20; // 소스당 1회 수집 상한
const SNIPPET_MAX_LEN = 200; // 발췌(인용 범위) 최대 길이

// rss-parser의 media:* 요소는 속성을 `$` 아래에 담는다. keepArray로 배열일 수 있다.
type MediaNode = { $?: { url?: string } };
type MediaField = MediaNode | MediaNode[] | undefined;

// 소스에서 한 항목을 표현하는 최소 형태 (rss-parser 결과에서 추출).
type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  // RSS 2.0 content:encoded — 본문 HTML(첫 <img> 추출용). customFields로 매핑.
  contentEncoded?: string;
  isoDate?: string;
  enclosure?: { url?: string };
  // Media RSS 확장 — 발행자가 대표 이미지를 명시하는 표준 경로.
  mediaContent?: MediaField;
  mediaThumbnail?: MediaField;
};

type ParsedFeed = { items: FeedItem[] };

export type CrawlResult = {
  created: number;
  skipped: number;
  sources: { id: string; siteName: string; created: number; skipped: number; error?: string }[];
};

type CommunitySourceDoc = {
  siteName: string;
  feedUrl: string;
  enabled: boolean;
};

// 항목 URL의 HTML을 가져와 og:image를 파싱하는 폴백용 훅(주입 가능). null이면 실패/스킵.
export type FetchHtml = (url: string) => Promise<string | null>;

export type RunCrawlOptions = {
  // 테스트에서 RSS fetch를 주입하기 위한 훅. 미지정 시 rss-parser로 실제 fetch.
  parseFeed?: (feedUrl: string) => Promise<ParsedFeed>;
  // 테스트에서 HTML fetch를 주입하기 위한 훅. 미지정 시 defaultFetchHtml.
  fetchHtml?: FetchHtml;
};

// 브라우저를 사칭하지 않고 봇임을 명시하는 정직한 UA. 크롤·자동탐지가 공유한다.
export const CRAWLER_USER_AGENT = 'UANDIBot/1.0 (+https://uandi.app; RSS reader)';
const FEED_ACCEPT = 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*';

const HTML_ACCEPT = 'text/html,application/xhtml+xml';
const OG_FETCH_TIMEOUT_MS = 10000;
const OG_FETCH_MAX_BYTES = 512 * 1024; // og 메타는 <head>에 있으므로 앞부분만 스캔하면 충분.

// 일부 플랫폼(예: 티스토리)은 Accept 헤더가 없으면 406으로 거부한다.
// media:*·content:encoded를 추출하려면 customFields 매핑이 필요하다(기본 파서는 무시).
function createFeedParser(): Parser {
  return new Parser({
    timeout: 15000,
    headers: { 'User-Agent': CRAWLER_USER_AGENT, Accept: FEED_ACCEPT },
    customFields: {
      item: [
        ['media:content', 'mediaContent', { keepArray: true }],
        ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
        ['content:encoded', 'contentEncoded'],
      ],
    },
  });
}

const defaultParser = createFeedParser();

// 단일 피드 URL을 파싱해 제목·항목 수를 확인한다. 자동탐지/검증에서 재사용.
export async function probeFeed(
  feedUrl: string
): Promise<{ title: string; itemCount: number } | null> {
  try {
    const feed = await createFeedParser().parseURL(feedUrl);
    return { title: feed.title ?? '', itemCount: feed.items?.length ?? 0 };
  } catch {
    return null;
  }
}

async function defaultParseFeed(feedUrl: string): Promise<ParsedFeed> {
  const feed = await defaultParser.parseURL(feedUrl);
  return { items: feed.items as FeedItem[] };
}

// 중복 수집 방지용 정규화: hash·trailing slash·utm_* 추적 파라미터 제거.
function normalizeUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) u.searchParams.delete(key);
    }
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return `${u.protocol}//${u.host.toLowerCase()}${path}${u.search}`;
  } catch {
    return rawUrl.trim();
  }
}

function hashUrl(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

// 인용 범위로만 쓰도록 짧게 자른다. HTML 태그 제거 + 길이 제한.
function toSnippet(item: FeedItem): string {
  const raw = (item.contentSnippet ?? item.content ?? '').replace(/<[^>]*>/g, '').trim();
  if (raw.length <= SNIPPET_MAX_LEN) return raw;
  return raw.slice(0, SNIPPET_MAX_LEN).trimEnd() + '…';
}

// HTML 엔티티 일부를 복원한다(og:image URL의 &amp; 등). 전체 디코딩은 불필요.
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#0*38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'");
}

// media:content / media:thumbnail(배열일 수 있음)에서 첫 url을 꺼낸다.
function firstMediaUrl(media: MediaField): string | null {
  if (!media) return null;
  const nodes = Array.isArray(media) ? media : [media];
  for (const node of nodes) {
    const url = node?.$?.url;
    if (url) return url;
  }
  return null;
}

// 본문 HTML에서 첫 <img src>를 추출한다(RSS가 대표 이미지를 따로 주지 않는 경우).
function firstImgSrc(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? decodeEntities(m[1]) : null;
}

// (A) RSS 범위 내에서 대표 이미지 URL을 해석한다. 우선순위: enclosure → media:content
//     → media:thumbnail → 본문 첫 <img>. 모두 없으면 null(이후 HTML 폴백 대상).
export function extractFeedImageUrl(item: FeedItem): string | null {
  return (
    item.enclosure?.url ??
    firstMediaUrl(item.mediaContent) ??
    firstMediaUrl(item.mediaThumbnail) ??
    firstImgSrc(item.contentEncoded ?? item.content) ??
    null
  );
}

// 단일 meta 태그의 content를 추출한다. property/name이 content 앞·뒤 어디든 매칭.
function matchMetaContent(html: string, prop: string): string | null {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const before = new RegExp(
    `<meta[^>]+(?:property|name)=["']${esc}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const after = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${esc}["']`,
    'i'
  );
  const value = html.match(before)?.[1] ?? html.match(after)?.[1] ?? null;
  return value ? decodeEntities(value) : null;
}

// (B) HTML에서 og:image(없으면 twitter:image)를 파싱한다. 상대경로는 pageUrl 기준 절대화.
export function parseOgImage(html: string, pageUrl: string): string | null {
  const head = html.slice(0, OG_FETCH_MAX_BYTES);
  const candidate =
    matchMetaContent(head, 'og:image:secure_url') ??
    matchMetaContent(head, 'og:image:url') ??
    matchMetaContent(head, 'og:image') ??
    matchMetaContent(head, 'twitter:image') ??
    matchMetaContent(head, 'twitter:image:src');
  if (!candidate) return null;
  try {
    return new URL(candidate, pageUrl).toString();
  } catch {
    return candidate;
  }
}

// 기본 HTML fetcher. 정직한 봇 UA, 타임아웃, HTML만 허용, 앞부분만 읽어 비용을 제한한다.
async function defaultFetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': CRAWLER_USER_AGENT, Accept: HTML_ACCEPT },
      signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    if (!(res.headers.get('content-type') ?? '').includes('html')) return null;
    const text = await res.text();
    return text.slice(0, OG_FETCH_MAX_BYTES);
  } catch {
    return null;
  }
}

async function crawlSource(
  db: Firestore,
  sourceId: string,
  source: CommunitySourceDoc,
  parseFeed: (feedUrl: string) => Promise<ParsedFeed>,
  fetchHtml: FetchHtml
): Promise<{ created: number; skipped: number; error?: string }> {
  const sourceRef = db.collection('communitySources').doc(sourceId);
  try {
    const feed = await parseFeed(source.feedUrl);
    const items = feed.items.slice(0, MAX_ITEMS_PER_SOURCE);

    let created = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.link) {
        skipped += 1;
        continue;
      }
      const normalized = normalizeUrl(item.link);
      const urlHash = hashUrl(normalized);
      // sourceId 해시를 문서 id로 사용해 중복 수집을 자연스럽게 막는다(별도 인덱스 불필요).
      const postRef = db.collection('communityPosts').doc(`scraped-${urlHash}`);
      const existing = await postRef.get();
      if (existing.exists) {
        skipped += 1;
        continue;
      }

      const originPublishedAt = item.isoDate ? Timestamp.fromDate(new Date(item.isoDate)) : null;

      // (A) RSS 메타에서 먼저 해석하고, 비었을 때만 (B) 원문 HTML의 og:image로 폴백한다.
      // 폴백은 신규 항목당 1회·이미지가 없을 때만 발생해 추가 fetch를 최소화한다.
      let ogImageUrl = extractFeedImageUrl(item);
      if (!ogImageUrl) {
        const html = await fetchHtml(item.link);
        if (html) ogImageUrl = parseOgImage(html, item.link);
      }

      await postRef.set({
        type: 'scraped',
        status: 'pending',
        title: (item.title ?? '').slice(0, 300),
        body: toSnippet(item),
        createdAt: FieldValue.serverTimestamp(),
        publishedAt: null,
        editedAt: null,
        reportCount: 0,
        source: {
          siteName: source.siteName,
          url: item.link,
          ogImageUrl,
          originPublishedAt,
          sourceId: urlHash,
        },
      });
      created += 1;
    }

    await sourceRef.update({
      lastCrawledAt: FieldValue.serverTimestamp(),
      lastError: null,
    });

    return { created, skipped };
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    await sourceRef.update({
      lastCrawledAt: FieldValue.serverTimestamp(),
      lastError: message.slice(0, 300),
    });
    return { created: 0, skipped: 0, error: message };
  }
}

// 활성 소스를 모두 크롤한다. 소스별 에러는 격리되어 lastError로 기록되고 다음 소스로 진행.
export async function runCrawl(db: Firestore, options: RunCrawlOptions = {}): Promise<CrawlResult> {
  const parseFeed = options.parseFeed ?? defaultParseFeed;
  const fetchHtml = options.fetchHtml ?? defaultFetchHtml;

  const snap = await db.collection('communitySources').where('enabled', '==', true).get();

  const result: CrawlResult = { created: 0, skipped: 0, sources: [] };

  for (const doc of snap.docs) {
    const source = doc.data() as CommunitySourceDoc;
    const { created, skipped, error } = await crawlSource(db, doc.id, source, parseFeed, fetchHtml);
    result.created += created;
    result.skipped += skipped;
    result.sources.push({ id: doc.id, siteName: source.siteName, created, skipped, error });
  }

  return result;
}
