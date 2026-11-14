import { createRequire } from 'node:module';
import type { Persistence } from 'firebase/auth';
import { SettleError } from '../core/errors';

/**
 * Firebase Auth 상태(리프레시 토큰 포함)를 OS 키체인에 두는 Persistence (docs/09-settle-mcp.md §7.3).
 * 파일로는 저장하지 않는다. 키체인을 못 쓰는 환경이면 _isAvailable이 false를 돌려주고
 * SDK는 메모리 퍼시스턴스로 떨어진다 — 그 경우 connect 시점에 KEYCHAIN_UNAVAILABLE로 거절한다.
 *
 * 구현 형태는 @firebase/auth의 getReactNativePersistence와 같다(빈 생성자로 new 가능한 클래스 + static type).
 * SDK 내부 인터페이스라 firebase 메이저 업그레이드 때 확인이 필요하다.
 */
export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void | Promise<unknown>;
};

const SERVICE = 'uandi-settle';

export function createKeyringStorage(service: string = SERVICE): KeyValueStorage {
  // 네이티브 모듈은 지연 로드 — 키체인이 없는 환경에서도 서버 자체는 뜨게
  type EntryLike = {
    getPassword(): string | null;
    setPassword(value: string): void;
    deletePassword(): Promise<boolean>;
  };
  type EntryCtor = new (service: string, account: string) => EntryLike;
  const require = createRequire(import.meta.url);
  let Entry: EntryCtor | null = null;
  const entry = (key: string): EntryLike => {
    if (!Entry) Entry = (require('@napi-rs/keyring') as { Entry: EntryCtor }).Entry;
    return new Entry(service, key);
  };
  return {
    getItem: (key) => entry(key).getPassword(),
    setItem: (key, value) => entry(key).setPassword(value),
    removeItem: (key) => entry(key).deletePassword(),
  };
}

const AVAILABILITY_PROBE_KEY = '__sak';

const log = (msg: string) => process.stderr.write(`[uandi-settle] ${msg}\n`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 같은 값이면 쓰지 않고, 실패하면 잠깐 뒤 한 번 더 시도한다.
 * 호스트가 서버를 둘 띄우면(채팅용 + 다른 클라이언트) 둘이 동시에 같은 키체인 항목을 갱신하다
 * macOS가 "이미 존재하는 항목"으로 거절하는 경쟁이 생긴다. 실제 사고: Claude Desktop에서 Server disconnected.
 */
export async function writeIfChanged(
  storage: KeyValueStorage,
  key: string,
  value: string
): Promise<void> {
  if (storage.getItem(key) === value) return;
  try {
    storage.setItem(key, value);
  } catch (first) {
    await sleep(150 + Math.random() * 200);
    if (storage.getItem(key) === value) return;
    try {
      storage.setItem(key, value);
    } catch {
      try {
        await storage.removeItem(key);
        storage.setItem(key, value);
      } catch (last) {
        throw last instanceof Error ? last : (first as Error);
      }
    }
  }
}

export function createKeyValuePersistence(storage: KeyValueStorage): Persistence {
  return class {
    static type = 'LOCAL' as const;
    readonly type = 'LOCAL' as const;

    async _isAvailable(): Promise<boolean> {
      try {
        storage.setItem(AVAILABILITY_PROBE_KEY, '1');
        await storage.removeItem(AVAILABILITY_PROBE_KEY);
        return true;
      } catch {
        return false;
      }
    }
    /** 퍼시스턴스 쓰기 실패는 로그만 남긴다 — 메모리의 로그인 상태로 서버는 계속 동작해야 한다 */
    async _set(key: string, value: unknown): Promise<void> {
      try {
        await writeIfChanged(storage, key, JSON.stringify(value));
      } catch (e) {
        log(`키체인 저장 실패(무시하고 계속): ${(e as Error).message}`);
      }
    }
    async _get<T>(key: string): Promise<T | null> {
      const json = storage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }
    async _remove(key: string): Promise<void> {
      try {
        await storage.removeItem(key);
      } catch (e) {
        log(`키체인 삭제 실패(무시하고 계속): ${(e as Error).message}`);
      }
    }
    _addListener(): void {}
    _removeListener(): void {}
  } as unknown as Persistence;
}

export async function assertStorageAvailable(storage: KeyValueStorage): Promise<void> {
  try {
    storage.setItem(AVAILABILITY_PROBE_KEY, '1');
    await storage.removeItem(AVAILABILITY_PROBE_KEY);
  } catch (e) {
    throw new SettleError(
      'KEYCHAIN_UNAVAILABLE',
      'OS 키체인을 쓸 수 없어 연결을 저장할 수 없습니다. 리프레시 토큰을 파일로는 저장하지 않습니다',
      { cause: (e as Error).message }
    );
  }
}
