import { readFile } from 'node:fs/promises';
import { PRINCIPLE_NUMBERS, PRINCIPLE_TITLES, type PrincipleNo } from '../core/principles';

/**
 * 원칙 문서(docs/09-settle-mcp.md §11.2)의 단일 소스는 옆의 principles.ko.md다.
 * 번들에 넣지 않고 파일로 읽는다 — tsx(src)·vitest(src)·dist(tsup onSuccess가 복사) 모두 같은 상대 경로.
 */
const PRINCIPLES_URL = new URL('./principles.ko.md', import.meta.url);

let cached: string | null = null;

export async function readPrinciplesMarkdown(): Promise<string> {
  if (cached === null) cached = await readFile(PRINCIPLES_URL, 'utf8');
  return cached;
}

/** "1. **제목.**" 줄에서 번호와 제목을 뽑는다 */
export function parsePrincipleTitles(markdown: string): { no: number; title: string }[] {
  return [...markdown.matchAll(/^(\d+)\. \*\*(.+?)\.?\*\*$/gmu)].map((m) => ({
    no: Number(m[1]),
    title: m[2]!,
  }));
}

/**
 * 문서와 코드(PRINCIPLE_TITLES)가 어긋나면 서버가 뜨지 않게 한다 — 번호·제목 불변 원칙의 기계 검사.
 * 어긋난 곳을 사람이 읽을 수 있는 문장으로 돌려준다. 비어 있으면 일치.
 */
export function principleMismatches(markdown: string): string[] {
  const found = parsePrincipleTitles(markdown);
  const problems: string[] = [];
  for (const no of PRINCIPLE_NUMBERS) {
    const hit = found.find((f) => f.no === no);
    if (!hit) problems.push(`문서에 원칙 ${no}이(가) 없습니다`);
    else if (hit.title !== PRINCIPLE_TITLES[no]) {
      problems.push(
        `원칙 ${no} 제목이 다릅니다: 문서 "${hit.title}" / 코드 "${PRINCIPLE_TITLES[no]}"`
      );
    }
  }
  for (const f of found) {
    if (!(PRINCIPLE_NUMBERS as readonly number[]).includes(f.no)) {
      problems.push(`문서에 코드가 모르는 번호 ${f.no}이(가) 있습니다`);
    }
  }
  const nos = found.map((f) => f.no);
  if (new Set(nos).size !== nos.length) problems.push('문서에 중복된 번호가 있습니다');
  return problems;
}

/** 결산 시작 때 LLM이 보여 주는 "굵은 제목 여섯 줄" */
export function principleHeadlines(): string[] {
  return PRINCIPLE_NUMBERS.map((no: PrincipleNo) => `${no}. ${PRINCIPLE_TITLES[no]}`);
}
