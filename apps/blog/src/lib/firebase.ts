import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth as firebaseGetAuth,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore as firebaseGetFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getStorage as firebaseGetStorage,
  type FirebaseStorage,
} from 'firebase/storage';

// 블로그는 정적 콘텐츠(마크다운)가 기본이고, Firebase는 /diary 한 곳에서만 쓴다.
// 그래서 apps/web처럼 앱 전역에서 초기화하지 않고, 클라이언트에서 필요할 때만 붙인다.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** 환경변수가 빠진 배포에서 흰 화면 대신 안내 문구를 띄우기 위한 플래그 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase 클라이언트 SDK는 브라우저에서만 사용할 수 있습니다.');
  }
  if (!isFirebaseConfigured) {
    throw new Error('NEXT_PUBLIC_FIREBASE_* 환경변수가 설정되지 않았습니다.');
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

    // 로컬 개발·검증용 (docs/05-testing-strategy.md) — 프로덕션 데이터에 붙지 않는다.
    if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(firebaseGetAuth(app), 'http://localhost:9099', {
          disableWarnings: true,
        });
        connectFirestoreEmulator(firebaseGetFirestore(app), 'localhost', 8080);
        connectStorageEmulator(firebaseGetStorage(app), 'localhost', 9199);
      } catch {
        // HMR로 이미 연결된 경우 무시
      }

      // 로컬 검증용: 에뮬레이터에서만 Playwright가 로그인할 수 있게 열어둔다.
      // (apps/web/src/lib/firebase/config.ts와 같은 방식)
      const testWindow = window as unknown as Record<string, unknown>;
      testWindow.__auth = firebaseGetAuth(app);
      testWindow.__signInWithEmailAndPassword = signInWithEmailAndPassword;
    }
  }
  return app;
}

export const getAuth = (): Auth => firebaseGetAuth(getFirebaseApp());
export const getDb = (): Firestore => firebaseGetFirestore(getFirebaseApp());
export const getStorage = (): FirebaseStorage => firebaseGetStorage(getFirebaseApp());
