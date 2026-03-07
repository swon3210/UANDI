const PROJECT_ID = 'uandi-test';
const AUTH_EMULATOR = 'http://localhost:9099';
const FIRESTORE_EMULATOR = 'http://localhost:8080';

export async function clearEmulatorData() {
  await Promise.all([
    fetch(
      `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { method: 'DELETE' }
    ),
    fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' }),
  ]);
}

export async function createTestUser(email: string, password: string): Promise<string> {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const { localId } = (await res.json()) as { localId: string };
  return localId;
}

export async function seedUserDocument(
  uid: string,
  email: string,
  coupleId: string | null = null
) {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: email },
          displayName: { stringValue: 'Test User' },
          photoURL: { nullValue: null },
          coupleId: coupleId ? { stringValue: coupleId } : { nullValue: null },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

type SeedCoupleOptions = {
  uid: string;
  inviteCode?: string;
  expiresInMs?: number; // 기본: 48h, 음수 = 이미 만료
  secondMemberUid?: string;
};

export async function seedCouple(options: SeedCoupleOptions): Promise<string> {
  const { uid, inviteCode = 'TEST99', expiresInMs = 48 * 60 * 60 * 1000, secondMemberUid } = options;
  const coupleId = `couple-test-${Date.now()}`;
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

  const memberValues = [{ stringValue: uid }];
  if (secondMemberUid) memberValues.push({ stringValue: secondMemberUid });

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: coupleId },
          memberUids: { arrayValue: { values: memberValues } },
          inviteCode: { stringValue: inviteCode },
          inviteCodeExpiresAt: { timestampValue: expiresAt },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  return coupleId;
}

export async function seedCoupleWithTwoMembers(uid1: string, uid2: string): Promise<string> {
  return seedCouple({ uid: uid1, secondMemberUid: uid2 });
}

export async function seedPhoto(
  coupleId: string,
  uploadedBy: string,
  options: { caption?: string; takenAt?: string } = {}
): Promise<string> {
  const photoId = `photo-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const takenAt = options.takenAt ?? new Date().toISOString();

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/photos/${photoId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: photoId },
          coupleId: { stringValue: coupleId },
          uploadedBy: { stringValue: uploadedBy },
          storageUrl: { stringValue: `https://storage.example.com/${photoId}.jpg` },
          thumbnailUrl: { stringValue: `https://storage.example.com/${photoId}_thumb.jpg` },
          caption: { stringValue: options.caption ?? '' },
          takenAt: { timestampValue: takenAt },
          uploadedAt: { timestampValue: new Date().toISOString() },
          width: { integerValue: '800' },
          height: { integerValue: '600' },
        },
      }),
    }
  );

  return photoId;
}

export async function seedCashbookEntry(
  coupleId: string,
  createdBy: string,
  options: {
    type: 'income' | 'expense';
    amount: number;
    category?: string;
    description?: string;
    date?: string;
  }
): Promise<string> {
  const entryId = `entry-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const date = options.date ?? new Date().toISOString();

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookEntries/${entryId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: entryId },
          coupleId: { stringValue: coupleId },
          createdBy: { stringValue: createdBy },
          type: { stringValue: options.type },
          amount: { integerValue: String(options.amount) },
          category: { stringValue: options.category ?? '기타' },
          description: { stringValue: options.description ?? '' },
          date: { timestampValue: date },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  return entryId;
}
