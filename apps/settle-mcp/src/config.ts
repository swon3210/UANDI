import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * 서버 설정. 환경변수로 덮어쓸 수 있고, 아무것도 없으면 프로덕션 말랑 가계부에 붙는다.
 * Firebase 웹 설정(apiKey 등)은 클라이언트 공개 값이라 기본값으로 박아 둔다 — 사용자가 설정할 게 없어야 한다.
 */
export type SettleConfig = {
  /** 규칙 JSON·스테이징 파일이 놓이는 디렉터리 */
  dataDir: string;
  rulesPath: string;
  storePath: string;
  /** 연결 코드 교환 라우트가 있는 웹앱 주소 */
  webUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
  };
  /** 로컬 에뮬레이터에 붙는다 (통합 테스트·개발용) */
  emulator: { authHost: string; firestoreHost: string } | null;
  /** uandi://rules 리소스에 실명(aliases 키)을 그대로 노출할지. false면 키를 가린다 (§6.1) */
  exposeAliasesInResource: boolean;
};

const PRODUCTION_FIREBASE = {
  apiKey: 'AIzaSyCYmwFHNU78vFLyPnI4nRKuG6aJawBDGkA',
  authDomain: 'uandi-55ee4.firebaseapp.com',
  projectId: 'uandi-55ee4',
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): SettleConfig {
  const dataDir = env.UANDI_SETTLE_DIR ?? join(homedir(), '.uandi-settle');
  const useEmulator = env.UANDI_SETTLE_EMULATOR === '1' || env.UANDI_SETTLE_EMULATOR === 'true';
  return {
    dataDir,
    rulesPath: join(dataDir, 'rules.json'),
    storePath: join(dataDir, 'staged.json'),
    webUrl: (env.UANDI_WEB_URL ?? 'https://uandi-web.vercel.app').replace(/\/$/, ''),
    firebase: useEmulator
      ? { apiKey: 'test-api-key', authDomain: 'localhost', projectId: 'uandi-test' }
      : {
          apiKey: env.UANDI_FIREBASE_API_KEY ?? PRODUCTION_FIREBASE.apiKey,
          authDomain: env.UANDI_FIREBASE_AUTH_DOMAIN ?? PRODUCTION_FIREBASE.authDomain,
          projectId: env.UANDI_FIREBASE_PROJECT_ID ?? PRODUCTION_FIREBASE.projectId,
        },
    emulator: useEmulator
      ? {
          authHost: env.FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost:9099',
          firestoreHost: env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080',
        }
      : null,
    exposeAliasesInResource: env.UANDI_EXPOSE_ALIASES !== 'false',
  };
}
