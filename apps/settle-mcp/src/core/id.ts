import { randomBytes } from 'node:crypto';

/** 시간순 정렬이 되는 짧은 ID. 앞 8자는 밀리초 타임스탬프(base36), 뒤 8자는 난수 */
export function newId(now: number = Date.now()): string {
  const time = now.toString(36).padStart(9, '0');
  const rand = randomBytes(6).toString('base64url').slice(0, 8);
  return `${time}${rand}`;
}
