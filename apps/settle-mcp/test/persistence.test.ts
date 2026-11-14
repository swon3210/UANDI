import { describe, expect, it } from 'vitest';
import {
  createKeyValuePersistence,
  writeIfChanged,
  type KeyValueStorage,
} from '../src/firebase/keyring-persistence';

class FlakyStorage implements KeyValueStorage {
  map = new Map<string, string>();
  failNextSets = 0;
  sets = 0;
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.sets += 1;
    if (this.failNextSets > 0) {
      this.failNextSets -= 1;
      throw new Error('The specified item already exists in the keychain.');
    }
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

describe('keyring persistence', () => {
  it('같은 값이면 키체인에 다시 쓰지 않는다', async () => {
    const s = new FlakyStorage();
    await writeIfChanged(s, 'k', 'v');
    await writeIfChanged(s, 'k', 'v');
    expect(s.sets).toBe(1);
  });

  it('동시 갱신으로 첫 쓰기가 거절돼도 재시도해 저장한다', async () => {
    const s = new FlakyStorage();
    s.failNextSets = 1;
    await writeIfChanged(s, 'k', 'v');
    expect(s.getItem('k')).toBe('v');
  });

  it('끝내 실패해도 _set은 던지지 않는다 (서버가 죽지 않게)', async () => {
    const s = new FlakyStorage();
    s.failNextSets = 99;
    const P = createKeyValuePersistence(s) as unknown as new () => {
      _set(key: string, value: unknown): Promise<void>;
      _get<T>(key: string): Promise<T | null>;
    };
    const p = new P();
    await expect(p._set('k', { a: 1 })).resolves.toBeUndefined();
    s.failNextSets = 0;
    await p._set('k', { a: 1 });
    expect(await p._get('k')).toEqual({ a: 1 });
  });
});
