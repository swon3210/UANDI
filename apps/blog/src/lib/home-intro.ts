import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * 홈 상단 인트로 카드의 문구·링크·노출 여부.
 *
 * 컴포넌트에 하드코딩해두면 문구 한 줄을 고치려고 tsx를 열어야 한다.
 * 글과 같은 자리(content/)에 두고, frontmatter로 노출을 끌 수 있게 한다.
 */
const INTRO_PATH = path.join(process.cwd(), '../../content/home-intro.md');

export type HomeIntroLink = {
  label: string;
  href: string;
  primary?: boolean;
};

export type HomeIntroContent = {
  markdown: string;
  links: HomeIntroLink[];
};

// 손으로 쓰는 YAML이라 형태가 어긋날 수 있다. 링크 한 줄이 잘못돼도
// 카드 전체가 깨지지 않게, 유효한 항목만 남기고 나머지는 버린다.
function toLinks(value: unknown): HomeIntroLink[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];

    const { label, href, primary } = item as Record<string, unknown>;
    if (typeof label !== 'string' || typeof href !== 'string') return [];
    if (!label.trim() || !href.trim()) return [];

    return [{ label, href, primary: primary === true }];
  });
}

/** 파일이 없거나 `enabled: false`거나 본문이 비어 있으면 null — 홈에서 카드를 렌더링하지 않는다. */
export function getHomeIntro(): HomeIntroContent | null {
  if (!fs.existsSync(INTRO_PATH)) return null;

  const { data, content } = matter(fs.readFileSync(INTRO_PATH, 'utf-8'));
  if (data.enabled === false) return null;

  const markdown = content.trim();
  if (!markdown) return null;

  return { markdown, links: toLinks(data.links) };
}
