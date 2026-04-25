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
  if (budget <= 0) return 'safe';
  const ratio = actual / budget;
  if (ratio >= 1.2) return 'over120';
  if (ratio >= 1.0) return 'over100';
  if (ratio >= 0.8) return 'warn80';
  return 'safe';
}

type Entry = {
  id?: string;
  type: 'income' | 'expense' | 'investment' | 'flex';
  amount: number;
  category: string;
};

type Category = { id: string; name: string };
type AnnualPlanItem = {
  categoryId: string;
  group: 'income' | 'expense' | 'investment' | 'flex';
  annualAmount: number;
  monthlyAmount: number | null;
  targetMonths: number[] | null;
};

function monthlyBudgetForItem(item: AnnualPlanItem, month: number): number {
  if (item.monthlyAmount != null) return item.monthlyAmount;
  if (item.targetMonths && item.targetMonths.length > 0) {
    return item.targetMonths.includes(month)
      ? Math.round(item.annualAmount / item.targetMonths.length)
      : 0;
  }
  return Math.round(item.annualAmount / 12);
}

function computeThresholds(
  entries: Entry[],
  expenseItems: AnnualPlanItem[],
  categories: Category[],
  month: number
): Map<string, Threshold> {
  const result = new Map<string, Threshold>();

  const actualByCat = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== 'expense') continue;
    const cat = categories.find((c) => c.name === e.category);
    if (!cat) continue;
    actualByCat.set(cat.id, (actualByCat.get(cat.id) ?? 0) + e.amount);
  }

  for (const item of expenseItems) {
    const budget = monthlyBudgetForItem(item, month);
    const actual = actualByCat.get(item.categoryId) ?? 0;
    result.set(item.categoryId, getBudgetThreshold(budget, actual));
  }

  const totalBudget = expenseItems.reduce((sum, i) => sum + monthlyBudgetForItem(i, month), 0);
  const totalActual = entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
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
  'couples/{coupleId}/cashbookEntries/{entryId}',
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
      logger.info('No annual plan for year', { coupleId, year });
      return;
    }

    const planId = planSnap.docs[0].id;
    const itemsSnap = await db
      .collection(`couples/${coupleId}/annualPlans/${planId}/items`)
      .get();

    const allEntries = entriesSnap.docs.map((d) => ({ ...(d.data() as Entry), id: d.id }));
    const beforeEntries = allEntries.filter((e) => e.id !== entryId);
    const categories = categoriesSnap.docs.map((d) => d.data() as Category);
    const items = itemsSnap.docs.map((d) => d.data() as AnnualPlanItem);
    const expenseItems = items.filter((i) => i.group === 'expense');

    const before = computeThresholds(beforeEntries, expenseItems, categories, month);
    const after = computeThresholds(allEntries, expenseItems, categories, month);

    const transitions: Transition[] = [];
    for (const [scopeId, afterT] of after) {
      const beforeT = before.get(scopeId) ?? 'safe';
      if (afterT === 'safe') continue;
      if (RANK[afterT] <= RANK[beforeT]) continue;
      const label =
        scopeId === 'total' ? '전체' : categories.find((c) => c.id === scopeId)?.name ?? '';
      transitions.push({ scopeId, threshold: afterT, label });
    }

    if (transitions.length === 0) return;

    const coupleDoc = await db.doc(`couples/${coupleId}`).get();
    const coupleData = coupleDoc.data();
    if (!coupleData) return;

    const memberUids: string[] = (coupleData.memberUids as string[] | undefined) ?? [];
    const partnerUids = memberUids.filter((u) => u !== createdBy);

    for (const partnerUid of partnerUids) {
      const settingsDoc = await db.doc(`users/${partnerUid}/settings/notifications`).get();
      const settings = settingsDoc.data();
      if (settings && settings.budgetWarning?.enabled === false) continue;

      const tokensSnap = await db.collection(`users/${partnerUid}/fcmTokens`).get();
      const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);

      if (tokens.length === 0) continue;

      for (const t of transitions) {
        try {
          await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: 'UANDI 가계부',
              body: pushBody(t),
            },
            data: {
              click_action: '/cashbook/history/monthly',
              scopeId: t.scopeId,
              threshold: t.threshold,
            },
          });
        } catch (err) {
          logger.error('FCM send failed', { partnerUid, err });
        }
      }
    }
  }
);
