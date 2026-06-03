import { CRAWLER_USER_AGENT, probeFeed } from './crawl';

// RSS 자동 탐지: 아무 페이지 URL을 받아 그 사이트의 RSS/Atom 피드 주소를 찾아낸다.
//  1) 페이지 HTML의 <link rel="alternate" type="application/rss+xml|atom+xml"> 추출
//  2) 흔한 패턴(`/rss`, `/feed`, `/atom.xml`) fallback (티스토리 등)
//  3) 후보를 실제 파싱해 검증 — 항목이 있는 첫 피드를 반환(제목 → 출처명 제안)

export type DiscoverResult = { feedUrl: string; siteName: string };

function extractFeedLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (!/rel\s*=\s*["']?[^"'>]*alternate/i.test(tag)) continue;
    if (!/type\s*=\s*["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      links.push(new URL(href, baseUrl).toString());
    } catch {
      // 잘못된 href는 무시
    }
  }
  return links;
}

function hostName(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export async function discoverFeed(pageUrl: string): Promise<DiscoverResult | null> {
  // 1) 페이지 HTML 가져오기 (실패해도 fallback 패턴으로 진행)
  let html = '';
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': CRAWLER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    });
    if (res.ok) html = await res.text();
  } catch {
    // 무시 — fallback 시도
  }

  const candidates: string[] = [];
  if (html) candidates.push(...extractFeedLinks(html, pageUrl));
  try {
    const origin = new URL(pageUrl).origin;
    candidates.push(`${origin}/rss`, `${origin}/feed`, `${origin}/atom.xml`);
  } catch {
    // 무시
  }

  // 2) 후보를 순서대로 검증 — 항목이 있는 첫 피드 채택
  const seen = new Set<string>();
  for (const url of candidates) {
    if (seen.has(url)) continue;
    seen.add(url);
    const probe = await probeFeed(url);
    if (probe && probe.itemCount > 0) {
      return { feedUrl: url, siteName: probe.title || hostName(pageUrl) };
    }
  }
  return null;
}
