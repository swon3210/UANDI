import { getAuthHeaders } from '@/services/community-admin';

// 어드민 크롤 소스 관리 — /api/community/sources (CRUD) + /api/community/crawl (수동 트리거).
// 모든 호출은 Bearer 토큰을 싣고, 서버에서 verifyAdmin으로 권한을 강제한다.

// API가 Timestamp를 ISO 문자열로 직렬화하므로 UI 표시용 string으로 받는다.
export type CommunitySourceView = {
  id: string;
  siteName: string;
  feedUrl: string;
  enabled: boolean;
  createdAt: string | null;
  lastCrawledAt: string | null;
  lastError: string | null;
};

export type CrawlSummary = {
  created: number;
  skipped: number;
  sources: { id: string; siteName: string; created: number; skipped: number; error?: string }[];
};

async function parseError(res: Response, fallback: string): Promise<never> {
  const err = await res.json().catch(() => ({ error: '' }));
  throw new Error(err.error || fallback);
}

export async function fetchSources(): Promise<CommunitySourceView[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/sources', { headers });
  if (!res.ok) await parseError(res, '소스 목록을 불러오지 못했어요');
  const data = (await res.json()) as { sources: CommunitySourceView[] };
  return data.sources;
}

export async function createSource(input: { siteName: string; feedUrl: string }): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/sources', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res, '소스를 추가하지 못했어요');
}

export async function updateSource(input: {
  id: string;
  siteName?: string;
  feedUrl?: string;
  enabled?: boolean;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/sources', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res, '소스를 수정하지 못했어요');
}

export async function deleteSource(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/sources', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ id }),
  });
  if (!res.ok) await parseError(res, '소스를 삭제하지 못했어요');
}

export async function triggerCrawl(): Promise<CrawlSummary> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/crawl', { method: 'POST', headers });
  if (!res.ok) await parseError(res, '수집에 실패했어요');
  return (await res.json()) as CrawlSummary;
}
