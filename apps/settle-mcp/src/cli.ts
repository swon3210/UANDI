import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config';
import { SettleError } from './core/errors';
import { createFirebaseClient } from './firebase/client';
import {
  assertStorageAvailable,
  createKeyValuePersistence,
  createKeyringStorage,
} from './firebase/keyring-persistence';
import { SessionManager } from './firebase/session';
import { createServer } from './server';
import { JsonFileStore } from './store/json-store';
import { CategoryCache, type ToolDeps } from './tools/shared';

// stdio 트랜스포트가 stdout을 쓰므로 사람이 읽는 메시지는 전부 stderr로
const log = (msg: string) => process.stderr.write(`${msg}\n`);

function bootstrap() {
  const config = loadConfig();
  const storage = createKeyringStorage(config.keyringService);
  const firebase = createFirebaseClient(config, createKeyValuePersistence(storage));
  const session = new SessionManager(firebase.auth, firebase.db, config);
  const deps: ToolDeps = {
    store: new JsonFileStore(config.storePath),
    rulesPath: config.rulesPath,
    session,
    categories: new CategoryCache(),
    exposeAliasesInResource: config.exposeAliasesInResource,
  };
  return { config, storage, session, deps };
}

async function serve() {
  const { deps } = bootstrap();
  const server = createServer(deps);
  await server.connect(new StdioServerTransport());
}

async function connect(code: string | undefined) {
  if (!code) {
    log('사용법: uandi-settle-mcp connect XXXX-XXXX');
    process.exitCode = 2;
    return;
  }
  const { config, storage, session } = bootstrap();
  await assertStorageAvailable(storage);
  const { uid, coupleId } = await session.connect(code);
  log(`연결됐습니다. uid=${uid} coupleId=${coupleId}`);
  log(`규칙 파일: ${config.rulesPath}`);
  log(
    'Claude Desktop 설정에 이 서버를 등록했다면 이제 "/settle-statement" 프롬프트로 결산을 시작할 수 있습니다.'
  );
}

async function disconnect() {
  const { session } = bootstrap();
  await session.disconnect();
  log('연결을 끊었습니다. 키체인의 로그인 정보도 지웠습니다.');
}

async function status() {
  const { config, session } = bootstrap();
  const current = await session.current();
  log(current ? `연결됨 — uid=${current.uid} coupleId=${current.coupleId}` : '연결되지 않음');
  log(`웹앱: ${config.webUrl}`);
  log(`데이터 디렉터리: ${config.dataDir}`);
  if (config.emulator)
    log(`에뮬레이터: auth ${config.emulator.authHost}, firestore ${config.emulator.firestoreHost}`);
}

function usage() {
  log(`uandi-settle-mcp — 말랑 가계부 데스크탑 결산 MCP 서버

  uandi-settle-mcp                 MCP 서버 실행 (stdio). Claude Desktop 등 호스트가 띄운다
  uandi-settle-mcp connect <code>  웹앱 /settings/desktop 에서 발급한 연결 코드로 로그인
  uandi-settle-mcp disconnect      로그인 해제 (키체인 정리)
  uandi-settle-mcp status          연결 상태 확인

환경변수: UANDI_SETTLE_DIR (데이터 디렉터리), UANDI_WEB_URL, UANDI_SETTLE_EMULATOR=1 (로컬 에뮬레이터), UANDI_EXPOSE_ALIASES=false`);
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  switch (command) {
    case undefined:
    case 'serve':
      return serve();
    case 'connect':
      return connect(arg);
    case 'disconnect':
      return disconnect();
    case 'status':
      return status();
    default:
      usage();
      process.exitCode = command === 'help' || command === '--help' ? 0 : 2;
  }
}

main()
  .then(() => {
    // serve는 트랜스포트가 살아 있는 동안 프로세스를 유지한다. 나머지 명령은 끝나면 종료
    if (process.argv[2] && process.argv[2] !== 'serve') process.exit(process.exitCode ?? 0);
  })
  .catch((e: unknown) => {
    if (e instanceof SettleError) {
      log(`[${e.code}] ${e.message}`);
      if (e.details) log(JSON.stringify(e.details, null, 2));
    } else {
      log(`오류: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
    }
    process.exit(1);
  });
