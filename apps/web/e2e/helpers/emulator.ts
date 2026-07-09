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
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
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
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
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
  const coupleId = `couple-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

  const memberValues = [{ stringValue: uid }];
  if (secondMemberUid) memberValues.push({ stringValue: secondMemberUid });

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: coupleId },
          memberUids: { arrayValue: { values: memberValues } },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  // inviteCodes/{code} 인덱스 동기 시드 — 두 멤버가 모두 있으면 consumedBy를 채워 "만석" 상태로 표현
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/inviteCodes/${inviteCode}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          code: { stringValue: inviteCode },
          coupleId: { stringValue: coupleId },
          createdBy: { stringValue: uid },
          expiresAt: { timestampValue: expiresAt },
          consumedBy: secondMemberUid ? { stringValue: secondMemberUid } : { nullValue: null },
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
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
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
  options: {
    name?: string;
    parentFolderId?: string | null;
    depth?: number;
    path?: string[];
    createdAt?: string;
  } = {}
): Promise<string> {
  const folderId = `folder-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const parentFolderId = options.parentFolderId ?? null;
  const depth = options.depth ?? 0;
  const path = options.path ?? [];
  const createdAt = options.createdAt ?? new Date().toISOString();

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/folders/${folderId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: folderId },
          coupleId: { stringValue: coupleId },
          name: { stringValue: options.name ?? '테스트 폴더' },
          createdBy: { stringValue: createdBy },
          createdAt: { timestampValue: createdAt },
          parentFolderId:
            parentFolderId != null ? { stringValue: parentFolderId } : { nullValue: null },
          depth: { integerValue: String(depth) },
          path: { arrayValue: { values: path.map((id) => ({ stringValue: id })) } },
        },
      }),
    }
  );

  return folderId;
}

type SeedRecurrence = {
  enabled: boolean;
  kind: 'dayOfMonth' | 'nthWeekday';
  dayOfMonth?: number;
  week?: number;
  weekday?: number;
  leadDays?: number;
  expectedAmount?: number | null;
  intervalMonths?: number;
  anchorMonth?: string;
};

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
    parentCategoryId?: string | null;
    description?: string;
    examples?: string[];
    recurrence?: SeedRecurrence;
  }
): Promise<string> {
  const categoryId = `cat-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const parentCategoryId = options.parentCategoryId ?? null;
  const examples = options.examples ?? [];

  const fields: Record<string, unknown> = {
    id: { stringValue: categoryId },
    coupleId: { stringValue: coupleId },
    group: { stringValue: options.group },
    subGroup: { stringValue: options.subGroup },
    name: { stringValue: options.name },
    icon: { stringValue: options.icon },
    color: { stringValue: options.color ?? '#D8635A' },
    isDefault: { booleanValue: options.isDefault ?? true },
    sortOrder: { integerValue: String(options.sortOrder ?? 0) },
    parentCategoryId:
      parentCategoryId === null ? { nullValue: null } : { stringValue: parentCategoryId },
    description: { stringValue: options.description ?? '' },
    examples: {
      arrayValue: {
        values: examples.map((v) => ({ stringValue: v })),
      },
    },
    createdAt: { timestampValue: new Date().toISOString() },
  };

  if (options.recurrence) {
    const r = options.recurrence;
    const rf: Record<string, unknown> = {
      enabled: { booleanValue: r.enabled },
      kind: { stringValue: r.kind },
    };
    if (r.dayOfMonth != null) rf.dayOfMonth = { integerValue: String(r.dayOfMonth) };
    if (r.week != null) rf.week = { integerValue: String(r.week) };
    if (r.weekday != null) rf.weekday = { integerValue: String(r.weekday) };
    if (r.leadDays != null) rf.leadDays = { integerValue: String(r.leadDays) };
    if (r.expectedAmount != null) rf.expectedAmount = { integerValue: String(r.expectedAmount) };
    fields.recurrence = { mapValue: { fields: rf } };
  }

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookCategories/${categoryId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ fields }),
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
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
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
    group: 'income' | 'expense' | 'flex';
    subGroup: string;
    monthlyAmounts: number[];
    inputMode?: 'regular' | 'irregular';
    baseMonthlyAmount?: number | null;
    ownerUid?: string | null;
  }
): Promise<string> {
  const itemId = `item-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const annualAmount = options.monthlyAmounts.reduce((s, v) => s + v, 0);

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/annualPlans/${planId}/items/${itemId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: itemId },
          planId: { stringValue: planId },
          coupleId: { stringValue: coupleId },
          categoryId: { stringValue: options.categoryId },
          group: { stringValue: options.group },
          subGroup: { stringValue: options.subGroup },
          monthlyAmounts: {
            arrayValue: {
              values: options.monthlyAmounts.map((v) => ({ integerValue: String(v) })),
            },
          },
          inputMode: { stringValue: options.inputMode ?? 'irregular' },
          baseMonthlyAmount:
            options.baseMonthlyAmount != null
              ? { integerValue: String(options.baseMonthlyAmount) }
              : { nullValue: null },
          annualAmount: { integerValue: String(annualAmount) },
          ownerUid: options.ownerUid ? { stringValue: options.ownerUid } : { nullValue: null },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );

  return itemId;
}

export async function seedCashbookEntry(
  coupleId: string,
  createdBy: string,
  options: {
    type: 'income' | 'expense' | 'flex';
    amount: number;
    category?: string;
    description?: string;
    date?: string;
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

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookEntries/${entryId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ fields }),
    }
  );

  return entryId;
}

// 현금흐름 캘린더 예측 (couples/{coupleId}/cashbookPredictions/{predictionId})
export async function seedPrediction(
  coupleId: string,
  createdBy: string,
  options: {
    type: 'income' | 'expense' | 'flex';
    amount: number;
    category?: string;
    description?: string;
    date?: string; // ISO. 예측 발생 예정일
    source?: 'calendar' | 'auto';
    status?: 'predicted' | 'rejected' | 'confirmed';
    recurrenceKey?: string | null;
    confidence?: number;
    rejectedUntil?: string | null; // ISO
    linkedEntryId?: string | null;
    promptDismissed?: boolean;
  }
): Promise<string> {
  const predictionId = `pred-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const date = options.date ?? new Date().toISOString();
  const now = new Date().toISOString();
  const recurrenceKey = options.recurrenceKey ?? null;

  const fields: Record<string, unknown> = {
    id: { stringValue: predictionId },
    coupleId: { stringValue: coupleId },
    createdBy: { stringValue: createdBy },
    source: { stringValue: options.source ?? 'calendar' },
    status: { stringValue: options.status ?? 'predicted' },
    type: { stringValue: options.type },
    amount: { integerValue: String(options.amount) },
    category: { stringValue: options.category ?? '기타' },
    description: { stringValue: options.description ?? '' },
    date: { timestampValue: date },
    recurrenceKey: recurrenceKey != null ? { stringValue: recurrenceKey } : { nullValue: null },
    confidence: { doubleValue: options.confidence ?? 1 },
    rejectedUntil: options.rejectedUntil
      ? { timestampValue: options.rejectedUntil }
      : { nullValue: null },
    linkedEntryId: options.linkedEntryId
      ? { stringValue: options.linkedEntryId }
      : { nullValue: null },
    promptDismissed: { booleanValue: options.promptDismissed ?? false },
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
  };

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookPredictions/${predictionId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ fields }),
    }
  );

  return predictionId;
}

// 현금흐름 캘린더 설정 (couples/{coupleId}/meta/cashflow)
export async function seedCashflowSettings(
  coupleId: string,
  options: {
    currentCash?: number;
    // type은 선택 — 리프레이밍 후 실제 폼은 type을 저장하지 않는다(실데이터와 동일하게 검증).
    paydays?: { id: string; label: string; type?: string; dayOfMonth: number }[];
    variableMode?: 1 | 3 | 6;
  } = {}
): Promise<void> {
  const paydays = options.paydays ?? [];
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/meta/cashflow`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          coupleId: { stringValue: coupleId },
          currentCash: { integerValue: String(options.currentCash ?? 0) },
          variableMode: { integerValue: String(options.variableMode ?? 3) },
          paydays: {
            arrayValue: {
              values: paydays.map((p) => {
                const fields: Record<string, unknown> = {
                  id: { stringValue: p.id },
                  label: { stringValue: p.label },
                  dayOfMonth: { integerValue: String(p.dayOfMonth) },
                };
                if (p.type) fields.type = { stringValue: p.type };
                return { mapValue: { fields } };
              }),
            },
          },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

// 월 결산 (couples/{coupleId}/cashbookSettlements/{YYYY-MM})
function pieSliceValue(name: string, value: number) {
  return {
    mapValue: {
      fields: { name: { stringValue: name }, value: { integerValue: String(value) } },
    },
  };
}

export async function seedSettlement(
  coupleId: string,
  options: {
    monthKey: string; // 'YYYY-MM'
    year: number;
    month: number; // 1-indexed
    status: 'draft' | 'completed';
    totals?: { income: number; expense: number; flex: number };
    aiAnalysis?: string;
  }
): Promise<void> {
  const {
    monthKey,
    year,
    month,
    status,
    totals = { income: 0, expense: 0, flex: 0 },
    aiAnalysis = '',
  } = options;
  const now = new Date().toISOString();

  const fields: Record<string, unknown> = {
    id: { stringValue: monthKey },
    coupleId: { stringValue: coupleId },
    year: { integerValue: String(year) },
    month: { integerValue: String(month) },
    status: { stringValue: status },
    attachments: { arrayValue: { values: [] } },
    createdAt: { timestampValue: now },
    updatedAt: { timestampValue: now },
    completedAt: status === 'completed' ? { timestampValue: now } : { nullValue: null },
  };

  if (status === 'completed') {
    const pieValues = [
      totals.income > 0 ? pieSliceValue('수입', totals.income) : null,
      totals.expense > 0 ? pieSliceValue('지출', totals.expense) : null,
      totals.flex > 0 ? pieSliceValue('FLEX', totals.flex) : null,
    ].filter(Boolean);

    fields.report = {
      mapValue: {
        fields: {
          totals: {
            mapValue: {
              fields: {
                income: { integerValue: String(totals.income) },
                expense: { integerValue: String(totals.expense) },
                flex: { integerValue: String(totals.flex) },
              },
            },
          },
          spending: { integerValue: String(totals.expense + totals.flex) },
          budgetCeiling: { integerValue: '0' },
          spentPct: { nullValue: null },
          barData: { arrayValue: { values: [] } },
          pieData: { arrayValue: { values: pieValues } },
          dailyData: { arrayValue: { values: [] } },
          aiAnalysis: { stringValue: aiAnalysis },
          entryCount: { integerValue: '0' },
          completedAt: { timestampValue: now },
        },
      },
    };
  } else {
    fields.report = { nullValue: null };
  }

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/cashbookSettlements/${monthKey}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ fields }),
    }
  );
}

// ───────────────────────────────────────────────────────────────
// 커뮤니티 (전역 컬렉션) — couples/ 격리 예외. 자세히는 docs/08-spaces.md 참고.
// ───────────────────────────────────────────────────────────────

type SeedCommunityPostOptions = {
  id?: string;
  type: 'user' | 'scraped';
  status: 'published' | 'pending' | 'hidden';
  title?: string;
  body?: string;
  publishedAt?: string | null; // ISO, pending이면 null 권장
  createdAt?: string;
  reportCount?: number;
  author?: {
    uid: string;
    coupleId: string | null;
    displayName: string;
    photoURL?: string | null;
  };
  imageUrl?: string | null;
  source?: {
    siteName: string;
    url: string;
    ogImageUrl?: string | null;
    originPublishedAt?: string | null;
    sourceId: string;
  };
};

export async function seedCommunityPost(options: SeedCommunityPostOptions): Promise<string> {
  const postId = options.id ?? `post-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = options.createdAt ?? new Date().toISOString();
  const publishedAt =
    options.publishedAt === undefined
      ? options.status === 'published'
        ? createdAt
        : null
      : options.publishedAt;

  const fields: Record<string, unknown> = {
    id: { stringValue: postId },
    type: { stringValue: options.type },
    status: { stringValue: options.status },
    title: { stringValue: options.title ?? '' },
    body: { stringValue: options.body ?? '' },
    createdAt: { timestampValue: createdAt },
    publishedAt: publishedAt ? { timestampValue: publishedAt } : { nullValue: null },
    reportCount: { integerValue: String(options.reportCount ?? 0) },
  };

  if (options.type === 'user' && options.author) {
    fields.author = {
      mapValue: {
        fields: {
          uid: { stringValue: options.author.uid },
          coupleId: options.author.coupleId
            ? { stringValue: options.author.coupleId }
            : { nullValue: null },
          displayName: { stringValue: options.author.displayName },
          photoURL: options.author.photoURL
            ? { stringValue: options.author.photoURL }
            : { nullValue: null },
        },
      },
    };
    fields.imageUrl = options.imageUrl ? { stringValue: options.imageUrl } : { nullValue: null };
  }

  if (options.type === 'scraped' && options.source) {
    fields.source = {
      mapValue: {
        fields: {
          siteName: { stringValue: options.source.siteName },
          url: { stringValue: options.source.url },
          ogImageUrl: options.source.ogImageUrl
            ? { stringValue: options.source.ogImageUrl }
            : { nullValue: null },
          originPublishedAt: options.source.originPublishedAt
            ? { timestampValue: options.source.originPublishedAt }
            : { nullValue: null },
          sourceId: { stringValue: options.source.sourceId },
        },
      },
    };
  }

  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/communityPosts/${postId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ fields }),
    }
  );

  return postId;
}

export async function seedCommunityReport(
  postId: string,
  reporterUid: string,
  reason: string = 'inappropriate'
): Promise<void> {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/communityPosts/${postId}/reports/${reporterUid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          reason: { stringValue: reason },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

// 재테크 자산 배분 목표 비율 (개인 소유 — sideHustles/{uid}/config/assetAllocation)
export async function seedAssetAllocation(
  coupleId: string,
  uid: string,
  ratio: {
    savings: number;
    stocks: number;
    realEstate: number;
    crypto: number;
    forex: number;
  }
): Promise<void> {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/sideHustles/${uid}/config/assetAllocation`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          coupleId: { stringValue: coupleId },
          savings: { integerValue: String(ratio.savings) },
          stocks: { integerValue: String(ratio.stocks) },
          realEstate: { integerValue: String(ratio.realEstate) },
          crypto: { integerValue: String(ratio.crypto) },
          forex: { integerValue: String(ratio.forex) },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

// 커뮤니티 크롤 소스 (전역 — 어드민 관리)
export async function seedCommunitySource(options: {
  id?: string;
  siteName: string;
  feedUrl: string;
  enabled?: boolean;
}): Promise<string> {
  const sourceId =
    options.id ?? `source-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/communitySources/${sourceId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          siteName: { stringValue: options.siteName },
          feedUrl: { stringValue: options.feedUrl },
          enabled: { booleanValue: options.enabled ?? true },
          createdAt: { timestampValue: new Date().toISOString() },
          lastCrawledAt: { nullValue: null },
          lastError: { nullValue: null },
        },
      }),
    }
  );
  return sourceId;
}

export async function seedAdminConfig(uid: string): Promise<void> {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          createdAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

// 가계부 입력 요청 "콕 찌르기" (couples/{coupleId}/nudges/{nudgeId})
export async function seedNudge(
  coupleId: string,
  fromUid: string,
  toUid: string,
  options: {
    message?: string;
    status?: 'pending' | 'seen' | 'done' | 'dismissed';
  } = {}
): Promise<string> {
  const nudgeId = `nudge-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/nudges/${nudgeId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          id: { stringValue: nudgeId },
          coupleId: { stringValue: coupleId },
          fromUid: { stringValue: fromUid },
          toUid: { stringValue: toUid },
          type: { stringValue: 'record-request' },
          message: { stringValue: options.message ?? '' },
          status: { stringValue: options.status ?? 'pending' },
          createdAt: { timestampValue: new Date().toISOString() },
          respondedAt: { nullValue: null },
        },
      }),
    }
  );
  return nudgeId;
}

type EmulatorNudge = {
  fromUid: string;
  toUid: string;
  type: string;
  message: string;
  status: string;
};

export async function listNudges(coupleId: string): Promise<EmulatorNudge[]> {
  const res = await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/couples/${coupleId}/nudges`,
    { headers: { Authorization: 'Bearer owner' } }
  );
  const json = (await res.json()) as {
    documents?: { fields: Record<string, { stringValue?: string }> }[];
  };
  return (json.documents ?? []).map((d) => ({
    fromUid: d.fields.fromUid?.stringValue ?? '',
    toUid: d.fields.toUid?.stringValue ?? '',
    type: d.fields.type?.stringValue ?? '',
    message: d.fields.message?.stringValue ?? '',
    status: d.fields.status?.stringValue ?? '',
  }));
}

export async function seedNotificationSettings(
  userId: string,
  options: {
    coupleId: string;
    recordReminderEnabled?: boolean;
    recordReminderTime?: string;
    recordReminderDays?: number[];
    budgetWarningEnabled?: boolean;
  }
): Promise<void> {
  const days = options.recordReminderDays ?? [1, 2, 3, 4, 5];
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/settings/notifications`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({
        fields: {
          coupleId: { stringValue: options.coupleId },
          userId: { stringValue: userId },
          recordReminder: {
            mapValue: {
              fields: {
                enabled: { booleanValue: options.recordReminderEnabled ?? true },
                time: { stringValue: options.recordReminderTime ?? '21:00' },
                days: {
                  arrayValue: {
                    values: days.map((d) => ({ integerValue: String(d) })),
                  },
                },
              },
            },
          },
          budgetWarning: {
            mapValue: {
              fields: {
                enabled: { booleanValue: options.budgetWarningEnabled ?? true },
              },
            },
          },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}
