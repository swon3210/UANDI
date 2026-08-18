import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = 'uandi-test';
const AUTH_EMULATOR = 'http://localhost:9099';
const FIRESTORE_EMULATOR = 'http://localhost:8080';

/** firestore.rules의 isDiaryOwner()와 같은 값이어야 한다. */
export const OWNER_EMAIL = 'swon3210@gmail.com';
export const OWNER_PASSWORD = 'test1234';
export const STRANGER_EMAIL = 'stranger@example.com';

const documentsUrl = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** 일기 문서만 비운다. 계정은 지우지 않고 재사용한다(아래 ensureTestUser 주석 참고). */
export async function clearDiaryEntries() {
  await fetch(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
}

/**
 * 테스트 계정을 준비한다. 이미 있으면 로그인해서 uid를 얻는다.
 * (Auth 에뮬레이터는 API 키로 프로젝트를 정하기 때문에 계정이 .env.test의
 *  projectId가 아니라 에뮬레이터 기본 프로젝트에 쌓인다. 그래서 계정을 지우는 대신 재사용한다.)
 */
export async function ensureTestUser(email: string, password = OWNER_PASSWORD): Promise<string> {
  const signUp = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (signUp.ok) {
    return ((await signUp.json()) as { localId: string }).localId;
  }

  const signIn = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!signIn.ok) {
    throw new Error(`테스트 계정을 준비하지 못했습니다: ${await signIn.text()}`);
  }
  return ((await signIn.json()) as { localId: string }).localId;
}

/** 목록 페이지네이션 검증용 — 관리자 권한(Bearer owner)으로 바로 넣는다. */
export async function seedDiaryEntries(authorUid: string, count: number) {
  for (let index = 0; index < count; index += 1) {
    const createdAt = new Date(Date.UTC(2026, 0, index + 1)).toISOString();
    await fetch(`${documentsUrl}/diaryEntries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          title: { stringValue: `씨앗 일기 ${index + 1}` },
          contentHtml: { stringValue: `<p>${index + 1}번째 씨앗 일기</p>` },
          excerpt: { stringValue: `${index + 1}번째 씨앗 일기` },
          coverImageUrl: { nullValue: null },
          authorUid: { stringValue: authorUid },
          createdAt: { timestampValue: createdAt },
          updatedAt: { timestampValue: createdAt },
        },
      }),
    });
  }
}

/** 이미지 업로드 테스트용 임시 PNG (2x2 검정) */
export function createTempPng(): string {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAFjDAGAAt4Aec6WgWEAAAAAElFTkSuQmCC',
    'base64'
  );
  const path = join(mkdtempSync(join(tmpdir(), 'diary-e2e-')), 'sample.png');
  writeFileSync(path, png);
  return path;
}
