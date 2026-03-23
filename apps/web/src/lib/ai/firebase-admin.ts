import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let _adminApp: App | undefined;

function getAdminApp(): App {
  if (!_adminApp) {
    if (getApps().length > 0) {
      _adminApp = getApps()[0]!;
    } else {
      // 로컬 에뮬레이터 환경에서는 프로젝트 ID만으로 초기화
      if (process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true') {
        _adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'uandi-test',
        });
      } else {
        // 프로덕션: 서비스 계정 키 사용
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? '{}'
        );
        _adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
    }
  }
  return _adminApp;
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
