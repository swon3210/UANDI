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
  coupleId: string | null = null,
  options: { displayName?: string; photoURL?: string | null } = {}
) {
  const { displayName = 'Test User', photoURL = null } = options;
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: email },
          displayName: { stringValue: displayName },
          photoURL: photoURL ? { stringValue: photoURL } : { nullValue: null },
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
  const {
    uid,
    inviteCode = 'TEST99',
    expiresInMs = 48 * 60 * 60 * 1000,
    secondMemberUid,
  } = options;
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
  options: { caption?: string; takenAt?: string; folderId?: string; tags?: string[] } = {}
): Promise<string> {
  const photoId = `photo-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const takenAt = options.takenAt ?? new Date().toISOString();

  const tagsValues = (options.tags ?? []).map((t) => ({ stringValue: t }));

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
          folderId: { stringValue: options.folderId ?? '' },
          tags: { arrayValue: { values: tagsValues.length > 0 ? tagsValues : [] } },
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

export async function seedFolder(
  coupleId: string,
  createdBy: string,
  options: { name?: string } = {}
): Promise<string> {
  const folderId = `folder-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/folders/${folderId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: folderId },
          coupleId: { stringValue: coupleId },
          name: { stringValue: options.name ?? '테스트 폴더' },
          createdBy: { stringValue: createdBy },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  return folderId;
}

export async function seedCashbookCategory(
  coupleId: string,
  options: {
    group: string;
    subGroup: string;
    name: string;
    icon: string;
    color?: string;
    isDefault?: boolean;
    sortOrder?: number;
  }
): Promise<string> {
  const categoryId = `cat-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookCategories/${categoryId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: categoryId },
          coupleId: { stringValue: coupleId },
          group: { stringValue: options.group },
          subGroup: { stringValue: options.subGroup },
          name: { stringValue: options.name },
          icon: { stringValue: options.icon },
          color: { stringValue: options.color ?? '#D8635A' },
          isDefault: { booleanValue: options.isDefault ?? true },
          sortOrder: { integerValue: String(options.sortOrder ?? 0) },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  return categoryId;
}

export async function seedDefaultCategories(coupleId: string): Promise<void> {
  const categories = [
    // 수입
    { group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', sortOrder: 0 },
    { group: 'income', subGroup: 'regular_income', name: '상여', icon: 'gift', sortOrder: 1 },
    {
      group: 'income',
      subGroup: 'irregular_income',
      name: '인센티브',
      icon: 'trophy',
      sortOrder: 0,
    },
    {
      group: 'income',
      subGroup: 'irregular_income',
      name: '부업',
      icon: 'briefcase',
      sortOrder: 1,
    },
    // 지출
    { group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house', sortOrder: 0 },
    {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '보험',
      icon: 'shield_check',
      sortOrder: 1,
    },
    {
      group: 'expense',
      subGroup: 'variable_common',
      name: '식비',
      icon: 'bowl_food',
      sortOrder: 0,
    },
    { group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus', sortOrder: 0 },
    // 재테크
    {
      group: 'investment',
      subGroup: 'cash_holding',
      name: '예적금',
      icon: 'piggy_bank',
      sortOrder: 0,
    },
    {
      group: 'investment',
      subGroup: 'investment',
      name: '국내주식',
      icon: 'chart_line_up',
      sortOrder: 0,
    },
    // Flex
    { group: 'flex', subGroup: 'joint_flex', name: '여행', icon: 'airplane', sortOrder: 0 },
    { group: 'flex', subGroup: 'personal_flex', name: '소비', icon: 'shopping_bag', sortOrder: 0 },
  ];

  for (const cat of categories) {
    await seedCashbookCategory(coupleId, cat);
  }
}

export async function seedAnnualPlan(
  coupleId: string,
  year: number,
  createdBy: string
): Promise<string> {
  const planId = `plan-${year}`;
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/annualPlans/${planId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: planId },
          coupleId: { stringValue: coupleId },
          year: { integerValue: String(year) },
          createdBy: { stringValue: createdBy },
          updatedAt: { timestampValue: new Date().toISOString() },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
  return planId;
}

export async function seedAnnualPlanItem(
  coupleId: string,
  planId: string,
  options: {
    categoryId: string;
    group: string;
    subGroup: string;
    annualAmount: number;
    monthlyAmount?: number | null;
    targetMonths?: number[] | null;
    ownerUid?: string | null;
  }
): Promise<string> {
  const itemId = `item-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const targetMonthsField = options.targetMonths
    ? {
        arrayValue: {
          values: options.targetMonths.map((m) => ({ integerValue: String(m) })),
        },
      }
    : { nullValue: null };

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/annualPlans/${planId}/items/${itemId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: itemId },
          planId: { stringValue: planId },
          coupleId: { stringValue: coupleId },
          categoryId: { stringValue: options.categoryId },
          group: { stringValue: options.group },
          subGroup: { stringValue: options.subGroup },
          annualAmount: { integerValue: String(options.annualAmount) },
          monthlyAmount:
            options.monthlyAmount != null
              ? { integerValue: String(options.monthlyAmount) }
              : { nullValue: null },
          targetMonths: targetMonthsField,
          ownerUid: options.ownerUid ? { stringValue: options.ownerUid } : { nullValue: null },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  return itemId;
}

export async function seedInvestmentPlan(
  coupleId: string,
  planId: string,
  options: {
    targetReturnRate: number;
    totalAvailable: number;
    targetAmount: number;
  }
): Promise<void> {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/annualPlans/${planId}/investmentPlan/main`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: 'main' },
          planId: { stringValue: planId },
          coupleId: { stringValue: coupleId },
          targetReturnRate: { integerValue: String(options.targetReturnRate) },
          totalAvailable: { integerValue: String(options.totalAvailable) },
          targetAmount: { integerValue: String(options.targetAmount) },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

export async function seedCashBalance(
  coupleId: string,
  options: {
    categoryId: string;
    year: number;
    month: number; // 1~12
    balance: number;
  }
): Promise<string> {
  const balanceId = `${options.categoryId}-${options.year}-${options.month}`;
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashBalances/${balanceId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: balanceId },
          coupleId: { stringValue: coupleId },
          categoryId: { stringValue: options.categoryId },
          year: { integerValue: String(options.year) },
          month: { integerValue: String(options.month) },
          balance: { integerValue: String(options.balance) },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
  return balanceId;
}

export async function seedCashbookEntry(
  coupleId: string,
  createdBy: string,
  options: {
    type: 'income' | 'expense' | 'investment' | 'flex';
    amount: number;
    category?: string;
    description?: string;
    date?: string;
    transactionType?: 'buy' | 'sell';
  }
): Promise<string> {
  const entryId = `entry-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const date = options.date ?? new Date().toISOString();

  const fields: Record<string, unknown> = {
    id: { stringValue: entryId },
    coupleId: { stringValue: coupleId },
    createdBy: { stringValue: createdBy },
    type: { stringValue: options.type },
    amount: { integerValue: String(options.amount) },
    category: { stringValue: options.category ?? '기타' },
    description: { stringValue: options.description ?? '' },
    date: { timestampValue: date },
    createdAt: { timestampValue: new Date().toISOString() },
  };

  if (options.transactionType) {
    fields.transactionType = { stringValue: options.transactionType };
  }

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookEntries/${entryId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  );

  return entryId;
}
