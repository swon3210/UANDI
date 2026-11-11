/**
 * 로케일 공통 상수·유틸 (서버/클라이언트 공용, Next 비의존).
 *
 * 로케일 결정 순서(docs/10-i18n.md):
 *   1. 쿠키 `uandi-locale` — 설정 화면에서 고른 값. 로그인 시 users/{uid}.locale 과 동기화
 *   2. Accept-Language — 첫 방문(쿠키 없음)
 *   3. DEFAULT_LOCALE('ko')
 *
 * URL prefix(/en/…) 는 쓰지 않는다. 모바일 WebView 딥링크·middleware 경로 규칙·E2E 경로가 전부 깨진다.
 */

export const LOCALES = ['ko', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ko';
export const LOCALE_COOKIE = 'uandi-locale';
/** 쿠키 수명 1년(초) */
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 언어 이름은 해당 언어로 고정 표기한다(번역 대상 아님). */
export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Accept-Language 헤더에서 지원 로케일을 고른다. q 값 내림차순으로 보고 첫 매칭을 쓴다.
 * 예: "en-US,en;q=0.9,ko;q=0.8" → 'en', "ko-KR,ko;q=0.9" → 'ko', 매칭 없음 → null
 */
export function pickLocaleFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((item) => item.tag && item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/** 쿠키 → Accept-Language → 기본값 순으로 로케일을 결정한다(서버 request config 와 manifest 가 사용). */
export function resolveLocale(input: {
  cookieValue?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(input.cookieValue)) return input.cookieValue;
  return pickLocaleFromAcceptLanguage(input.acceptLanguage) ?? DEFAULT_LOCALE;
}

/** 브라우저 쿠키에서 로케일을 읽는다(클라이언트 전용). 없거나 잘못된 값이면 null. */
export function getLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return isLocale(value) ? value : null;
}

/** 로케일 쿠키를 쓴다(클라이언트 전용). 서버 컴포넌트는 다음 요청·router.refresh() 부터 반영한다. */
export function setLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * 지금 렌더 중인 문서의 로케일. 클라이언트는 `<html lang>`(서버가 요청마다 확정) 을 읽고,
 * 서버(SSR)에서는 기본값을 돌려준다. React 컴포넌트 안에서는 next-intl 의 `useLocale()` 을 쓰고,
 * 이 함수는 훅을 쓸 수 없는 순수 포맷 유틸(통화·날짜)에서만 쓴다.
 */
export function getActiveLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** Intl / dayjs 에 넘길 BCP 47 태그 */
export const INTL_LOCALE_TAGS: Record<Locale, string> = {
  ko: 'ko-KR',
  en: 'en-US',
};
