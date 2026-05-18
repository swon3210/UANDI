import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

type Threshold = 'safe' | 'warn80' | 'over100' | 'over120';

const RANK: Record<Threshold, number> = {
  safe: 0,
  warn80: 1,
  over100: 2,
  over120: 3,
};

function getBudgetThreshold(budget: number, actual: number): Threshold {
  if (!Number.isFinite(budget) || budget <= 0) return 'safe';
  const ratio = actual / budget;
  if (ratio >= 1.2) return 'over120';
  if (ratio >= 1.0) return 'over100';
  if (ratio >= 0.8) return 'warn80';
  return 'safe';
}

type Entry = {
  id?: string;
  type: 'income' | 'expense' | 'flex';
  amount: number;
  category: string;
};

type Category = { id: string; name: string; parentCategoryId?: string | null };

type AnnualPlanItem = {
  categoryId: string;
  group: 'income' | 'expense' | 'flex';
  monthlyAmounts?: number[];
  monthlyAmount?: number | null;
  annualAmount?: number;
  targetMonths?: number[] | null;
};

function monthlyBudgetForItem(item: AnnualPlanItem, month: number): number {
  if (Array.isArray(item.monthlyAmounts) && item.monthlyAmounts.length === 12) {
    const v = item.monthlyAmounts[month - 1];
    return typeof v === 'number' ? v : 0;
  }
  if (item.monthlyAmount != null) return item.monthlyAmount;
  if (item.targetMonths && item.targetMonths.length > 0) {
    return item.targetMonths.includes(month)
      ? Math.round((item.annualAmount ?? 0) / item.targetMonths.length)
      : 0;
  }
  if (typeof item.annualAmount === 'number' && item.annualAmount > 0) {
    return Math.round(item.annualAmount / 12);
  }
  return 0;
}

function computeThresholds(
  entries: Entry[],
  expenseItems: AnnualPlanItem[],
  categories: Category[],
  month: number
): Map<string, Threshold> {
  const result = new Map<string, Threshold>();

  // 자식 카테고리에 올린 지출도 부모 예산 소진율에 반영해야 한다(spec: 04a-cashbook-categories).
  // 자식 카테고리의 actual은 본인 + 부모 양쪽 버킷에 누적한다.
  const actualByCat = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== 'expense') continue;
    const cat = categories.find((c) => c.name === e.category);
    if (!cat) continue;
    actualByCat.set(cat.id, (actualByCat.get(cat.id) ?? 0) + e.amount);
    if (cat.parentCategoryId) {
      actualByCat.set(
        cat.parentCategoryId,
        (actualByCat.get(cat.parentCategoryId) ?? 0) + e.amount
      );
    }
  }

  for (const item of expenseItems) {
    const budget = monthlyBudgetForItem(item, month);
    const actual = actualByCat.get(item.categoryId) ?? 0;
    result.set(item.categoryId, getBudgetThreshold(budget, actual));
  }

  const totalBudget = expenseItems.reduce(
    (sum, i) => sum + monthlyBudgetForItem(i, month),
    0
  );
  const totalActual = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  result.set('total', getBudgetThreshold(totalBudget, totalActual));

  return result;
}

type Transition = {
  scopeId: string;
  threshold: Exclude<Threshold, 'safe'>;
  label: string;
};

function pushBody(t: Transition): string {
  const subject = t.scopeId === 'total' ? '이번 달 전체 지출' : `이번 달 ${t.label}`;
  if (t.threshold === 'warn80') return `${subject}이 예산의 80%를 넘었어요 🟡`;
  if (t.threshold === 'over100') return `${subject}이 예산을 넘었어요 🔴`;
  return `${t.scopeId === 'total' ? '이번 달 전체 지출' : t.label}이 예산보다 20% 이상 초과됐어요 🚨`;
}

export const onCashbookEntryCreated = onDocumentCreated(
  {
    document: 'couples/{coupleId}/cashbookEntries/{entryId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data() as Entry & {
      createdBy: string;
      date: admin.firestore.Timestamp;
    };

    if (data.type !== 'expense') return;

    const { coupleId, entryId } = event.params as { coupleId: string; entryId: string };
    const createdBy = data.createdBy;
    const date = data.date.toDate();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    logger.info('budgetAlert triggered', {
      coupleId,
      entryId,
      category: data.category,
      amount: data.amount,
      year,
      month,
    });

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const [entriesSnap, categoriesSnap, planSnap] = await Promise.all([
      db
        .collection(`couples/${coupleId}/cashbookEntries`)
        .where('date', '>=', monthStart)
        .where('date', '<', monthEnd)
        .get(),
      db.collection(`couples/${coupleId}/cashbookCategories`).get(),
      db.collection(`couples/${coupleId}/annualPlans`).where('year', '==', year).get(),
    ]);

    if (planSnap.empty) {
      logger.info('budgetAlert skip: no annual plan for year', { coupleId, year });
      return;
    }

    const planId = planSnap.docs[0].id;
    const itemsSnap = await db
      .collection(`couples/${coupleId}/annualPlans/${planId}/items`)
      .get();

    const queriedEntries = entriesSnap.docs.map((d) => ({ ...(d.data() as Entry), id: d.id }));
    const beforeEntries = queriedEntries.filter((e) => e.id !== entryId);
    // Firestore consistency 타이밍 이슈로 신규 엔트리가 쿼리에 누락될 수 있어 명시적으로 포함한다.
    const afterEntries: Entry[] = [...beforeEntries, { ...data, id: entryId } as Entry];
    const categories = categoriesSnap.docs.map(
      (d) => ({ ...(d.data() as Omit<Category, 'id'>), id: d.id }) as Category
    );
    const items = itemsSnap.docs.map((d) => d.data() as AnnualPlanItem);
    const expenseItems = items.filter((i) => i.group === 'expense');

    const before = computeThresholds(beforeEntries, expenseItems, categories, month);
    const after = computeThresholds(afterEntries, expenseItems, categories, month);

    // 신규 엔트리가 기여하는 scope들: 본인 카테고리 id + (자식이면) 부모 카테고리 id.
    const entryCat = categories.find((c) => c.name === data.category) ?? null;
    const contributingScopes = new Set<string>();
    if (entryCat) {
      contributingScopes.add(entryCat.id);
      if (entryCat.parentCategoryId) contributingScopes.add(entryCat.parentCategoryId);
    }

    logger.info('budgetAlert thresholds', {
      categoryCount: categories.length,
      expenseItemCount: expenseItems.length,
      beforeEntriesCount: beforeEntries.length,
      afterEntriesCount: afterEntries.length,
      entryCategoryId: entryCat?.id ?? null,
      contributingScopes: Array.from(contributingScopes),
      before: Object.fromEntries(before),
      after: Object.fromEntries(after),
      expenseItemDiag: expenseItems.map((i) => ({
        categoryId: i.categoryId,
        monthlyAmount: monthlyBudgetForItem(i, month),
        categoryName: categories.find((c) => c.id === i.categoryId)?.name ?? null,
      })),
    });

    // 정책:
    //  - 카테고리 scope: 신규 엔트리가 그 scope에 기여(=본인 카테고리 또는 자식의 부모)하고
    //    after가 safe가 아니면 매번 알림(재알림 허용).
    //  - total scope:    rising-edge일 때만 알림(이미 초과 상태에서 매 지출마다 "전체 over120" 폭주 방지).
    const transitions: Transition[] = [];
    for (const [scopeId, afterT] of after) {
      if (afterT === 'safe') continue;
      const beforeT = before.get(scopeId) ?? 'safe';
      if (scopeId === 'total') {
        if (RANK[afterT] <= RANK[beforeT]) continue;
      } else {
        if (!contributingScopes.has(scopeId)) continue;
      }
      const label =
        scopeId === 'total' ? '전체' : categories.find((c) => c.id === scopeId)?.name ?? '';
      transitions.push({ scopeId, threshold: afterT, label });
    }

    if (transitions.length === 0) {
      logger.info('budgetAlert no transitions', {
        coupleId,
        entryId,
        entryCategoryId: entryCat?.id ?? null,
      });
      return;
    }

    logger.info('budgetAlert transitions detected', { transitions });

    const coupleDoc = await db.doc(`couples/${coupleId}`).get();
    const coupleData = coupleDoc.data();
    if (!coupleData) {
      logger.warn('budgetAlert couple doc missing', { coupleId });
      return;
    }

    const memberUids: string[] = (coupleData.memberUids as string[] | undefined) ?? [];

    logger.info('budgetAlert recipients', {
      memberUidCount: memberUids.length,
      createdBy,
    });

    for (const uid of memberUids) {
      const isSelf = uid === createdBy;

      const settingsDoc = await db.doc(`users/${uid}/settings/notifications`).get();
      const settings = settingsDoc.data();
      if (settings && settings.budgetWarning?.enabled === false) {
        logger.info('budgetAlert skip: budgetWarning disabled', { uid, isSelf });
        continue;
      }

      const tokensSnap = await db.collection(`users/${uid}/fcmTokens`).get();
      const tokens = tokensSnap.docs
        .map((d) => d.data().token as string)
        .filter(Boolean);

      if (tokens.length === 0) {
        logger.info('budgetAlert skip: no FCM tokens', { uid, isSelf });
        continue;
      }

      for (const t of transitions) {
        try {
          const body = isSelf ? `[내 지출] ${pushBody(t)}` : pushBody(t);
          const res = await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: 'UANDI 가계부',
              body,
            },
            data: {
              click_action: '/cashbook/history/monthly',
              scopeId: t.scopeId,
              threshold: t.threshold,
              recipient: isSelf ? 'self' : 'partner',
            },
          });
          logger.info('budgetAlert FCM sent', {
            uid,
            isSelf,
            transition: t,
            successCount: res.successCount,
            failureCount: res.failureCount,
          });
        } catch (err) {
          logger.error('budgetAlert FCM send failed', { uid, isSelf, err });
        }
      }
    }
  }
);
