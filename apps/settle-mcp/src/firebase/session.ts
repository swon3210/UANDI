import { signInWithCustomToken, signOut, type Auth } from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { SettleError } from '../core/errors';
import type { SettleConfig } from '../config';
import { createFirestoreGateway, type CashbookGateway } from './gateway';

export type Session = {
  uid: string;
  coupleId: string;
  gateway: CashbookGateway;
};

export type SessionProvider = {
  /** 로그인되어 있지 않으면 NOT_CONNECTED (연결 방법 안내 포함) */
  require(): Promise<Session>;
  /** 로그인 여부만. 상태 조회용 */
  current(): Promise<{ uid: string; coupleId: string } | null>;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Firebase Auth 세션 관리 (docs/09-settle-mcp.md §7).
 * - connect(code): 웹앱의 exchange 라우트에서 커스텀 토큰을 받아 로그인. 퍼시스턴스가 키체인이라 다음 실행에 자동 복원
 * - coupleId는 users/{uid} 문서에서 읽어 캐시한다. 도구는 입력으로 coupleId를 받지 않는다
 */
export class SessionManager implements SessionProvider {
  private resolved: Session | null = null;

  constructor(
    private readonly auth: Auth,
    private readonly db: Firestore,
    private readonly config: SettleConfig,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  private notConnected(): SettleError {
    return new SettleError(
      'NOT_CONNECTED',
      `말랑 가계부에 연결되어 있지 않습니다. 웹앱 ${this.config.webUrl}/settings/desktop 에서 연결 코드를 발급받은 뒤, 터미널에서 "uandi-settle-mcp connect XXXX-XXXX"를 실행하세요`,
      { connectPage: `${this.config.webUrl}/settings/desktop` }
    );
  }

  async current(): Promise<{ uid: string; coupleId: string } | null> {
    await this.auth.authStateReady();
    const user = this.auth.currentUser;
    if (!user) return null;
    const session = await this.resolve(user.uid);
    return { uid: session.uid, coupleId: session.coupleId };
  }

  async require(): Promise<Session> {
    await this.auth.authStateReady();
    const user = this.auth.currentUser;
    if (!user) throw this.notConnected();
    return this.resolve(user.uid);
  }

  private async resolve(uid: string): Promise<Session> {
    if (this.resolved?.uid === uid) return this.resolved;
    let coupleId: string | undefined;
    try {
      const snap = await getDoc(doc(this.db, `users/${uid}`));
      coupleId = snap.data()?.coupleId as string | undefined;
    } catch (e) {
      throw new SettleError('FIRESTORE_READ_FAILED', '사용자 정보를 읽지 못했습니다', {
        cause: (e as Error).message,
      });
    }
    if (!coupleId) {
      throw new SettleError(
        'NOT_CONNECTED',
        '커플 연결이 필요합니다. 앱에서 커플을 먼저 연결하세요'
      );
    }
    this.resolved = { uid, coupleId, gateway: createFirestoreGateway(this.db, coupleId, uid) };
    return this.resolved;
  }

  /** 연결 코드(XXXX-XXXX)를 커스텀 토큰으로 바꿔 로그인한다 */
  async connect(code: string): Promise<{ uid: string; coupleId: string }> {
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z2-9]{8}$/.test(normalized)) {
      throw new SettleError('CONNECT_FAILED', '연결 코드 형식이 맞지 않습니다 (예: ABCD-2345)');
    }

    let res: Response;
    try {
      res = await this.fetchImpl(`${this.config.webUrl}/api/desktop/exchange`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });
    } catch (e) {
      throw new SettleError('CONNECT_FAILED', `웹앱에 연결할 수 없습니다: ${this.config.webUrl}`, {
        cause: (e as Error).message,
      });
    }
    const body = (await res.json().catch(() => ({}))) as { customToken?: string; error?: string };
    if (!res.ok || !body.customToken) {
      throw new SettleError(
        'CONNECT_FAILED',
        body.error ?? `연결 코드 교환 실패 (HTTP ${res.status})`
      );
    }

    try {
      await signInWithCustomToken(this.auth, body.customToken);
    } catch (e) {
      throw new SettleError('CONNECT_FAILED', 'Firebase 로그인에 실패했습니다', {
        cause: (e as Error).message,
      });
    }
    this.resolved = null;
    const session = await this.require();
    return { uid: session.uid, coupleId: session.coupleId };
  }

  async disconnect(): Promise<void> {
    await signOut(this.auth);
    this.resolved = null;
  }
}
