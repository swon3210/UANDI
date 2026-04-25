import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth as firebaseGetAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore as firebaseGetFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage as firebaseGetStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging as firebaseGetMessaging, isSupported as messagingIsSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
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

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!(await messagingIsSupported())) return null;
  return firebaseGetMessaging(getFirebaseApp());
}

export { firebaseConfig };
