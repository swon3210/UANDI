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
  sources: {
    id: string;
    siteName: string;
    created: number;
    skipped: number;
    // 피드는 정상 응답했지만 항목이 0개인 경우(네이버 블로그 등 서버 IP 차단 포함).
    emptyFeed?: boolean;
    error?: string;
  }[];
};

// 빈 피드일 때 소스에 기록·어드민에 노출할 사유. 일부 사이트는 RSS가 정상 200을 주면서도
// 데이터센터(서버) IP에는 항목을 비워 사실상 차단하므로(네이버 블로그 등), 조용한 0건 대신 명시한다.
const EMPTY_FEED_NOTE =
  '빈 피드 — 응답은 정상이지만 수집할 항목이 0개예요. 일부 사이트(예: 네이버 블로그)는 서버(데이터센터) IP의 RSS 접근을 빈 피드로 막습니다.';

// 크롤 실패 원인은 사이트마다 다른 형태로 나타난다(차단은 네이버 전용이 아니다):
//   403/401 거부, 429 빈도제한, 5xx 장애, 타임아웃, 연결 실패, RSS 대신 차단 페이지(HTML) 반환 등.
// rss-parser의 raw 에러 메시지를 어드민이 이해할 친화적 사유로 분류한다(원문은 괄호로 보존).
export function describeFeedError(rawMessage: string): string {
  const m = rawMessage.toLowerCase();
  const status = rawMessage.match(/status code (\d{3})/i)?.[1];

  if (status === '403' || status === '401') {
    return `접근 거부(${status}) — 사이트가 서버 IP의 접근을 차단했을 수 있어요. (${rawMessage})`;
  }
  if (status === '429') {
    return `요청 제한(429) — 수집 빈도가 제한됐어요. 잠시 후 다시 시도해주세요. (${rawMessage})`;
  }
  if (status === '500' || status === '502' || status === '503') {
    return `사이트 응답 오류(${status}) — 일시적 장애이거나 봇 차단일 수 있어요. (${rawMessage})`;
  }
  if (status === '404' || status === '410') {
    return `피드 주소를 찾을 수 없어요(${status}) — 피드 URL이 바뀌었는지 확인해주세요. (${rawMessage})`;
  }
  if (
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('etimedout') ||
    m.includes('aborted') ||
    m.includes('abort')
  ) {
    return `응답 시간 초과 — 사이트가 느리거나 서버 IP를 막고 응답을 주지 않을 수 있어요. (${rawMessage})`;
  }
  if (
    m.includes('enotfound') ||
    m.includes('econnrefused') ||
    m.includes('econnreset') ||
    m.includes('eai_again') ||
    m.includes('socket hang up') ||
    m.includes('epipe') ||
    m.includes('certificate') ||
    m.includes('ssl')
  ) {
    return `사이트에 연결하지 못했어요 — 주소 오류이거나 네트워크/차단 문제일 수 있어요. (${rawMessage})`;
  }
  // rss-parser가 본문을 RSS/Atom으로 인식 못함 → 차단 페이지·캡차 등 HTML을 받았을 가능성.
  if (
    m.includes('not recognized') ||
    m.includes('non-whitespace before first tag') ||
    m.includes('unexpected') ||
    m.includes('unclosed') ||
    m.includes('invalid character') ||
    m.includes('attribute') ||
    m.includes('parse')
  ) {
    return `피드 형식이 아니에요 — 사이트가 RSS 대신 차단/안내 페이지(HTML)를 돌려줬을 수 있어요. (${rawMessage})`;
  }
  return rawMessage;
}

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
): Promise<{ created: number; skipped: number; emptyFeed?: boolean; error?: string }> {
  const sourceRef = db.collection('communitySources').doc(sourceId);
  try {
    const feed = await parseFeed(source.feedUrl);
    const items = feed.items.slice(0, MAX_ITEMS_PER_SOURCE);

    // 피드는 정상 응답했으나 항목이 0개 → 차단/빈 피드 신호로 소스에 사유를 남겨 어드민에 알린다.
    if (items.length === 0) {
      await sourceRef.update({
        lastCrawledAt: FieldValue.serverTimestamp(),
        lastError: EMPTY_FEED_NOTE,
      });
      return { created: 0, skipped: 0, emptyFeed: true };
    }

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
    const raw = err instanceof Error ? err.message : '알 수 없는 오류';
    const message = describeFeedError(raw);
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
    const { created, skipped, emptyFeed, error } = await crawlSource(
      db,
      doc.id,
      source,
      parseFeed,
      fetchHtml
    );
    result.created += created;
    result.skipped += skipped;
    result.sources.push({ id: doc.id, siteName: source.siteName, created, skipped, emptyFeed, error });
  }

  return result;
}
