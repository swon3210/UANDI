import { createHash } from 'node:crypto';

/**
 * 적요 정규화 — 지문·정확일치 규칙의 키.
 * NFC 정규화 → 소문자 → 공백·구두점 제거.
 * "스타벅스 코리아", "스타벅스코리아", "스타벅스-코리아"가 같은 키가 된다.
 */
export function normalize(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

/**
 * 배치 내 중복 지문 (§4.3).
 * 같은 날·같은 금액·같은 적요만 같은 지문. 같은 날 같은 금액의 다른 거래(커피 2번)는 적요로 구분된다.
 */
export function fingerprint(date: string, amount: number, rawDescription: string): string {
  const key = `${date}|${amount}|${normalize(rawDescription)}`;
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}
