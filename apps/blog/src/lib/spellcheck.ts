import dns from 'node:dns';
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
  provider: 'daum' | 'naver' | 'pnu';
  issues: SpellIssue[];
};

const CHECK_TIMEOUT_SEC = 20;

/**
 * Node 18+는 DNS 결과를 받은 순서 그대로 쓴다(verbatim). IPv6 주소가 먼저 오는데
 * 네트워크가 IPv6로는 나가지 못하면, 브라우저는 멀쩡한 사이트에 Node만 연결하지
 * 못하고 타임아웃 난다. 국내 검사기 서버들이 여기 걸리는 일이 잦아 IPv4를 먼저 쓴다.
 */
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // 아주 옛 Node에는 없는 API다. 없으면 그냥 기본 동작으로 둔다.
}

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

/* ------------------------------------------------------------------ *
 * 부산대 맞춤법 검사기 (speller.cs.pusan.ac.kr)
 *
 * hanspell 1.x는 다음·네이버만 쓰는데, 둘 다 비공식 스크래핑이라 자주 막힌다.
 * 구버전 hanspell(0.9.x)의 부산대 구현을 참고해 fetch로 다시 썼다.
 * 개인·비상업 용도로만 쓸 것 (검사기 이용 약관).
 * ------------------------------------------------------------------ */

// https가 막히는 환경이 있어 http도 차례로 시도한다.
const PNU_URLS = [
  'https://speller.cs.pusan.ac.kr/results',
  'http://speller.cs.pusan.ac.kr/results',
];
const PNU_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const PNU_MAX_WORDS = 250;

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(value: string): string {
  return value.replace(
    /&(amp|lt|gt|quot|#39|apos|nbsp);/g,
    (matched) => HTML_ENTITIES[matched] ?? matched
  );
}

/** 부산대 서버는 한 번에 250단어 남짓만 받는다. 줄 단위로 모아 나눈다. */
function splitByWordCount(text: string, maxWords: number): string[] {
  const parts: string[] = [];
  let current: string[] = [];
  let words = 0;

  const flush = () => {
    if (current.length > 0) parts.push(current.join('\n'));
    current = [];
    words = 0;
  };

  for (const line of text.split('\n')) {
    const lineWords = line.split(/\s+/).filter(Boolean);

    // 한 줄이 통째로 한도를 넘으면 그 줄만 단어 단위로 쪼갠다.
    if (lineWords.length > maxWords) {
      flush();
      for (let i = 0; i < lineWords.length; i += maxWords) {
        parts.push(lineWords.slice(i, i + maxWords).join(' '));
      }
      continue;
    }

    if (words + lineWords.length > maxWords) flush();
    current.push(line);
    words += lineWords.length;
  }

  flush();
  return parts;
}

type PnuErrInfo = { orgStr: string; candWord?: string; help?: string };

function parsePnuResponse(html: string): SpellCheckTypo[] {
  const matched = html.match(/data\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (!matched) return [];

  const parsed = JSON.parse(matched[1]) as { errInfo?: PnuErrInfo[] }[];

  return (parsed[0]?.errInfo ?? []).map((error) => {
    const candidates = (error.candWord ?? '').replace(/\|$/, '');
    const info = (error.help ?? '')
      .replace(/< *[bB][rR] *\/>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      token: decodeEntities(error.orgStr),
      suggestions: candidates ? decodeEntities(candidates).split('|') : [],
      info: decodeEntities(info),
    };
  });
}

export async function checkWithPnu(text: string): Promise<SpellCheckTypo[]> {
  const typos: SpellCheckTypo[] = [];
  let failure: Error | null = null;

  for (const part of splitByWordCount(text, PNU_MAX_WORDS)) {
    for (const url of PNU_URLS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': PNU_USER_AGENT,
          },
          body: new URLSearchParams({ text1: `${part}\r\n` }),
          signal: AbortSignal.timeout(CHECK_TIMEOUT_SEC * 1000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();
        if (!html.includes('한국어 맞춤법/문법 검사기')) {
          throw new Error('응답 형식이 바뀌었습니다');
        }

        typos.push(...parsePnuResponse(html));
        failure = null;
        break;
      } catch (error) {
        failure = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  if (typos.length === 0 && failure) throw failure;
  return typos;
}

const PROVIDER_LABEL: Record<SpellCheckResult['provider'], string> = {
  daum: '다음',
  naver: '네이버',
  pnu: '부산대',
};

/** 'fetch failed'만으로는 원인을 모른다 — cause의 코드까지 붙인다. */
export function errorText(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const cause = error.cause as { code?: string; message?: string } | undefined;
  const code = cause?.code ? ` (${cause.code})` : '';
  const message = `${error.message}${code}`;

  return message.length > 80 ? `${message.slice(0, 80)}…` : message;
}

export async function checkKoreanSpelling(markdown: string): Promise<SpellCheckResult> {
  const masked = maskUncheckable(markdown);
  if (!masked.trim()) return { provider: 'daum', issues: [] };

  // 셋 다 비공식 경로라 수시로 막힌다. 하나가 되면 그걸로 간다.
  const providers: { name: SpellCheckResult['provider']; run: () => Promise<SpellCheckTypo[]> }[] =
    [
      { name: 'daum', run: () => runChecker(spellCheckByDAUM, masked) },
      { name: 'naver', run: () => runChecker(spellCheckByNAVER, masked) },
      { name: 'pnu', run: () => checkWithPnu(masked) },
    ];

  const failures: string[] = [];

  for (const provider of providers) {
    try {
      return { provider: provider.name, issues: toIssues(await provider.run(), masked) };
    } catch (error) {
      failures.push(`${PROVIDER_LABEL[provider.name]}: ${errorText(error)}`);
    }
  }

  throw new Error(failures.join(' / '));
}
