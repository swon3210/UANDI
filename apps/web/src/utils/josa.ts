/**
 * 한글 조사 처리 유틸.
 * 단어의 마지막 글자에 받침이 있는지 따져 알맞은 조사를 붙인다.
 * 한글 음절이 아닌 경우(영문/숫자/기호)는 받침이 없는 것으로 간주한다.
 */

/** 마지막 글자에 받침(종성)이 있으면 true. */
export function hasBatchim(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  // 한글 음절 범위(가~힣)가 아니면 받침 없음으로 처리
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

type JosaPair = '이/가' | '을/를' | '은/는' | '과/와' | '으로/로';

/**
 * 받침 유무에 따라 조사를 골라 단어 뒤에 붙인다.
 * 예: josa('식비', '이/가') → '식비가', josa('소모품', '이/가') → '소모품이'
 */
export function josa(word: string, pair: JosaPair): string {
  const [withBatchim, withoutBatchim] = pair.split('/') as [string, string];
  return word + (hasBatchim(word) ? withBatchim : withoutBatchim);
}
