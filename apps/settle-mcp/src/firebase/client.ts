import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import type { SettleConfig } from '../config';

export type FirebaseClient = { app: FirebaseApp; auth: Auth; db: Firestore };

/** @param appName 테스트에서 한 프로세스에 여러 인스턴스를 만들 때만 지정 */
export function createFirebaseClient(
  config: SettleConfig,
  persistence: Persistence,
  appName?: string
): FirebaseClient {
  const options = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
  };
  const app = appName ? initializeApp(options, appName) : (getApps()[0] ?? initializeApp(options));
  const auth = initializeAuth(app, { persistence });
  const db = getFirestore(app);

  if (config.emulator) {
    connectAuthEmulator(auth, `http://${config.emulator.authHost}`, { disableWarnings: true });
    const [host, port] = config.emulator.firestoreHost.split(':');
    connectFirestoreEmulator(db, host ?? 'localhost', Number(port ?? 8080));
  }

  return { app, auth, db };
}
