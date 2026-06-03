import { createHash } from 'crypto';
import Parser from 'rss-parser';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';

// 커뮤니티 크롤 코어 — 스케줄/수동 트리거가 공유한다.
// 명세: docs/pages/community/community-feed.md (크롤러 명세)
// 법적 가드레일: RSS/공식 피드의 메타데이터(제목·링크·발췌·OG이미지 URL)만 저장.
//   원문 본문 전문/이미지를 복제·재호스팅하지 않는다. 클릭 시 원문으로 링크아웃.

const MAX_ITEMS_PER_SOURCE = 20; // 소스당 1회 수집 상한
const SNIPPET_MAX_LEN = 200; // 발췌(인용 범위) 최대 길이

// 소스에서 한 항목을 표현하는 최소 형태 (rss-parser 결과에서 추출).
type FeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  enclosure?: { url?: string };
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

export type RunCrawlOptions = {
  // 테스트에서 RSS fetch를 주입하기 위한 훅. 미지정 시 rss-parser로 실제 fetch.
  parseFeed?: (feedUrl: string) => Promise<ParsedFeed>;
};

const defaultParser = new Parser();

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

async function crawlSource(
  db: Firestore,
  sourceId: string,
  source: CommunitySourceDoc,
  parseFeed: (feedUrl: string) => Promise<ParsedFeed>
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
          ogImageUrl: item.enclosure?.url ?? null,
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

  const snap = await db.collection('communitySources').where('enabled', '==', true).get();

  const result: CrawlResult = { created: 0, skipped: 0, sources: [] };

  for (const doc of snap.docs) {
    const source = doc.data() as CommunitySourceDoc;
    const { created, skipped, error } = await crawlSource(db, doc.id, source, parseFeed);
    result.created += created;
    result.skipped += skipped;
    result.sources.push({ id: doc.id, siteName: source.siteName, created, skipped, error });
  }

  return result;
}
