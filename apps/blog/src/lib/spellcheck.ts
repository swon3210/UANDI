import { spellCheckByDAUM, spellCheckByNAVER, type SpellCheckTypo } from 'hanspell';

/**
 * 한국어 맞춤법 검사 (다음·네이버 온라인 검사기 / hanspell).
 *
 * 글쓰기 에디터 전용이며, 본문 텍스트가 외부 서비스로 전송된다.
 * 그래서 로컬 개발 서버에서만 돈다 — route.dev.ts 참고.
 */

export type SpellIssue = {
  id: string;
  token: string;
  suggestion: string;
  info: string;
  /** 본문에서의 위치. 찾지 못하면 -1 (고치기 버튼 없이 설명만 보여준다) */
  start: number;
  end: number;
};

export type SpellCheckResult = {
  provider: 'daum' | 'naver';
  issues: SpellIssue[];
};

const CHECK_TIMEOUT_SEC = 15;

/**
 * 검사하면 안 되는 구간을 같은 길이의 공백으로 덮는다.
 *
 * 길이를 보존하는 이유는 검사 결과에서 찾은 위치를 **원문 오프셋 그대로** 쓸 수 있기
 * 때문이다. 코드·URL을 잘라내면 위치가 어긋나 엉뚱한 곳을 고치게 된다.
 */
export function maskUncheckable(markdown: string): string {
  const chars = markdown.split('');

  const blankOut = (start: number, length: number) => {
    for (let i = start; i < start + length && i < chars.length; i += 1) {
      if (chars[i] !== '\n') chars[i] = ' ';
    }
  };

  const maskAll = (pattern: RegExp) => {
    for (const match of markdown.matchAll(pattern)) {
      if (match.index === undefined) continue;
      blankOut(match.index, match[0].length);
    }
  };

  const frontmatter = markdown.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if (frontmatter?.index === 0) blankOut(0, frontmatter[0].length);

  maskAll(/```[\s\S]*?```/g); // 코드 블록
  maskAll(/`[^`\n]*`/g); // 인라인 코드
  maskAll(/\]\([^)\n]*\)/g); // 링크·이미지 주소 (표시 텍스트는 남긴다)
  maskAll(/https?:\/\/\S+/g); // 맨 URL
  maskAll(/<[^>\n]+>/g); // HTML 태그
  maskAll(/^(?:#{1,6}|>|[-*+]|\d+\.)\s+/gm); // 줄머리 마크다운 기호
  maskAll(/\*\*|__|~~|\||\*/g); // 강조·표 구분자

  return chars.join('');
}

function findOccurrences(haystack: string, needle: string): number[] {
  if (!needle) return [];

  const found: number[] = [];
  let from = 0;

  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    found.push(at);
    from = at + needle.length;
  }

  return found;
}

type Checker = typeof spellCheckByDAUM | typeof spellCheckByNAVER;

function runChecker(checker: Checker, text: string): Promise<SpellCheckTypo[]> {
  return new Promise((resolve, reject) => {
    const typos: SpellCheckTypo[] = [];
    let failure: Error | null = null;

    // hanspell은 긴 글을 1000자씩 나눠 보내고, 실패한 조각마다 error를 부른 뒤
    // 마지막에 end를 부른다. 한 조각이 실패했다고 성공한 조각까지 버리지 않는다.
    checker(
      text,
      CHECK_TIMEOUT_SEC,
      (found) => typos.push(...found),
      () => {
        if (typos.length === 0 && failure) reject(failure);
        else resolve(typos);
      },
      (error) => {
        failure = error instanceof Error ? error : new Error(String(error));
      }
    );
  });
}

function toIssues(typos: SpellCheckTypo[], masked: string): SpellIssue[] {
  const issues: SpellIssue[] = [];
  const seen = new Set<string>();

  typos.forEach((typo, typoIndex) => {
    const suggestion = typo.suggestions?.[0] ?? '';
    // 대치어가 없거나 원문과 같으면 고칠 게 없다.
    if (!suggestion || suggestion === typo.token) return;

    const positions = findOccurrences(masked, typo.token);
    const spots = positions.length > 0 ? positions : [-1];

    spots.forEach((start) => {
      const key = [typo.token, suggestion, start].join('::');
      if (seen.has(key)) return;
      seen.add(key);

      issues.push({
        id: `${typoIndex}-${start}-${issues.length}`,
        token: typo.token,
        suggestion,
        info: (typo.info ?? '').replace(/\s+/g, ' ').trim(),
        start,
        end: start === -1 ? -1 : start + typo.token.length,
      });
    });
  });

  return issues.sort((a, b) => a.start - b.start);
}

export async function checkKoreanSpelling(markdown: string): Promise<SpellCheckResult> {
  const masked = maskUncheckable(markdown);
  if (!masked.trim()) return { provider: 'daum', issues: [] };

  try {
    const typos = await runChecker(spellCheckByDAUM, masked);
    return { provider: 'daum', issues: toIssues(typos, masked) };
  } catch {
    // 다음 쪽이 막히거나 응답 형식이 바뀌는 일이 잦다 — 네이버로 한 번 더 시도한다.
    const typos = await runChecker(spellCheckByNAVER, masked);
    return { provider: 'naver', issues: toIssues(typos, masked) };
  }
}
