import {
  initializeAnalytics,
  isSupported,
  logEvent,
  setDefaultEventParameters,
  setUserId,
  setUserProperties,
  type Analytics,
} from 'firebase/analytics';
import { firebaseConfig, getFirebaseApp } from '@/lib/firebase/config';
import { getClientPlatform } from '@/lib/native';

/**
 * 사용 분석(Firebase Analytics / GA4). 명세: docs/09-analytics.md
 *
 * - measurementId 가 없거나 에뮬레이터 모드면 아무것도 보내지 않는다(로컬·E2E·Preview 오염 방지).
 * - 금액·메모·카테고리 이름 같은 가계부 내용과 개인 식별 정보는 보내지 않는다.
 *   파라미터는 아래 타입에 정의한 enum·개수만 허용한다.
 */

export type EntriesAddedSource = 'history' | 'quick_add' | 'bubble' | 'import';

type AnalyticsEvents = {
  sign_up: { method: 'google' | 'apple' | 'other' };
  couple_created: undefined;
  couple_joined: undefined;
  entries_added: { source: EntriesAddedSource; count: number };
  annual_plan_created: undefined;
};

let analyticsPromise: Promise<Analytics | null> | null = null;
let initialPageViewSkipped = false;

function isAnalyticsEnabled(): boolean {
  return !!firebaseConfig.measurementId && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR !== 'true';
}

/** GA로 보낼 경로. 초대 코드·사진 태그 이름처럼 사용자 값이 들어가는 세그먼트를 가린다. */
export function sanitizePath(pathname: string): string {
  return pathname
    .replace(/^\/invite\/[^/]+/, '/invite/:code')
    .replace(/^\/inner\/photos\/tag\/[^/]+/, '/inner/photos/tag/:tag');
}

// gtag 은 모든 이벤트에 현재 URL(쿼리스트링 포함)을 붙이므로, 정리한 URL로 덮어쓴다.
function setSanitizedLocation(pathname: string): { page_location: string; page_path: string } {
  const page_path = sanitizePath(pathname);
  const page_location = `${window.location.origin}${page_path}`;
  setDefaultEventParameters({ page_location });
  return { page_location, page_path };
}

function loadAnalytics(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = (async () => {
    if (typeof window === 'undefined' || !isAnalyticsEnabled()) return null;
    if (!(await isSupported())) return null;
    // 초기화 전에 지정한 기본 파라미터는 config 직후 첫 이벤트 전에 적용된다.
    setSanitizedLocation(window.location.pathname);
    // 화면 이동 시 page_view 는 trackPageView 로 직접 보낸다. 단, 첫 로드는 gtag 가
    // send_page_view: false 를 무시하고 위의 정리된 page_location 으로 자동 전송한다(trackPageView 참고).
    return initializeAnalytics(getFirebaseApp(), { config: { send_page_view: false } });
  })().catch(() => null);
  return analyticsPromise;
}

export function trackEvent<K extends keyof AnalyticsEvents>(
  name: K,
  ...params: AnalyticsEvents[K] extends undefined ? [] : [AnalyticsEvents[K]]
): void {
  void loadAnalytics().then((analytics) => {
    if (analytics) logEvent(analytics, name as string, params[0]);
  });
}

export function trackPageView(pathname: string): void {
  void loadAnalytics().then((analytics) => {
    if (!analytics) return;
    const location = setSanitizedLocation(pathname);
    // 첫 로드의 page_view 는 gtag 가 이미 자동으로 보냈다 — 또 보내면 화면당 2회로 집계된다(2026-11-11 프로덕션 확인).
    if (!initialPageViewSkipped) {
      initialPageViewSkipped = true;
      return;
    }
    logEvent(analytics, 'page_view', location);
  });
}

/** 로그인 사용자를 식별한다(user_id = Firebase uid). 로그아웃이면 null. */
export function identifyUser(user: { uid: string; hasCouple: boolean } | null): void {
  void loadAnalytics().then((analytics) => {
    if (!analytics) return;
    // global: gtag 'set' 으로 보낸다. 기본값('config' update)은 현재 gtag.js 에서 이후 이벤트에
    // uid·up.* 가 붙지 않는 것을 프로덕션에서 확인했다(2026-11-11).
    setUserId(analytics, user?.uid ?? null, { global: true });
    setUserProperties(
      analytics,
      {
        client_platform: getClientPlatform(),
        has_couple: user ? String(user.hasCouple) : null,
      },
      { global: true }
    );
  });
}

export function signUpMethod(providerId: string | undefined): AnalyticsEvents['sign_up']['method'] {
  if (providerId === 'google.com') return 'google';
  if (providerId === 'apple.com') return 'apple';
  return 'other';
}
