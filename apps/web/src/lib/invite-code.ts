/**
 * 초대 링크(/invite/{code})로 들어온 코드를 로그인 전후로 넘기기 위한 저장소.
 * 값은 JSON 문자열로 저장해 useSsrSafeLocalStorage와 포맷을 맞춘다.
 */
export const PENDING_INVITE_CODE_KEY = 'uandi:pendingInviteCode';

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

/** 6자리 영숫자면 대문자로 정규화해 돌려주고, 아니면 null */
export function normalizeInviteCode(raw: string | null | undefined): string | null {
  const code = (raw ?? '').trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export function savePendingInviteCode(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_INVITE_CODE_KEY, JSON.stringify(code));
    window.dispatchEvent(new StorageEvent('storage', { key: PENDING_INVITE_CODE_KEY }));
  } catch {
    // quota 등은 무시 — 링크 없이 코드 입력으로 폴백
  }
}

export function readPendingInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_INVITE_CODE_KEY);
    return raw ? normalizeInviteCode(JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

export function clearPendingInviteCode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_INVITE_CODE_KEY);
    window.dispatchEvent(new StorageEvent('storage', { key: PENDING_INVITE_CODE_KEY }));
  } catch {
    // ignore
  }
}

/** 읽고 바로 지운다 — 코드 입력 화면을 한 번만 자동으로 열기 위해 */
export function consumePendingInviteCode(): string | null {
  const code = readPendingInviteCode();
  if (code) clearPendingInviteCode();
  return code;
}
