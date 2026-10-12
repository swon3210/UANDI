import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth as firebaseGetAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore as firebaseGetFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as firebaseGetStorage, connectStorageEmulator } from 'firebase/storage';
import {
  getMessaging as firebaseGetMessaging,
  isSupported as messagingIsSupported,
  type Messaging,
} from 'firebase/messaging';
import { getFunctions as firebaseGetFunctions, type Functions } from 'firebase/functions';

/**
 * 프로덕션 authDomain(uandi-web.vercel.app)은 안드로이드 앱의 App Links(autoVerify) 도메인이기도 하다.
 * 다른 출처(Vercel Preview 등)에서 로그인 팝업이 이 도메인의 /__/auth/handler 를 열면
 * 크롬이 링크를 앱으로 넘겨 앱이 실행돼 버린다. 그래서 프로덕션이 아닌 *.vercel.app 에서는
 * App Links와 무관한 기본 도메인({projectId}.firebaseapp.com)으로 인증 핸드오프를 한다.
 * (localhost·인앱 WebView 등 그 외 환경은 설정값 그대로)
 */
function resolveAuthDomain(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (typeof window === 'undefined' || !configured || !projectId) return configured;
  const host = window.location.hostname;
  if (host !== configured && host.endsWith('.vercel.app')) {
    return `${projectId}.firebaseapp.com`;
  }
  return configured;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: resolveAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | undefined;

function getFirebaseApp(): FirebaseApp {
  // Firebase Client SDK는 브라우저 전용 — 서버에서 호출 시 아무 동작도 하지 않음
  if (typeof window === 'undefined') return undefined as unknown as FirebaseApp;
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

    // 에뮬레이터 연결 (05-testing-strategy.md 참고)
    if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(
          firebaseGetAuth(_app),
          `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost:9099'}`,
          { disableWarnings: true }
        );
        connectFirestoreEmulator(firebaseGetFirestore(_app), 'localhost', 8080);
        connectStorageEmulator(firebaseGetStorage(_app), 'localhost', 9199);
      } catch {
        // 이미 연결된 경우 무시 (HMR 재연결 방지)
      }

      // Playwright E2E 테스트용: page.evaluate에서 auth 인스턴스 접근
      (window as unknown as Record<string, unknown>).__auth = firebaseGetAuth(_app);
      (window as unknown as Record<string, unknown>).__signInWithEmailAndPassword =
        signInWithEmailAndPassword;
    }
  }
  return _app;
}

export const getAuth = () => firebaseGetAuth(getFirebaseApp());
export const getDb = () => firebaseGetFirestore(getFirebaseApp());
export const getStorage = () => firebaseGetStorage(getFirebaseApp());

export const getFunctionsAsia = (): Functions =>
  firebaseGetFunctions(getFirebaseApp(), 'asia-northeast3');

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!(await messagingIsSupported())) return null;
  return firebaseGetMessaging(getFirebaseApp());
}

export { firebaseConfig };
