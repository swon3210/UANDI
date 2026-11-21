import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { loadUserTokenDocs, sendAndPrune, type TokenDoc } from './fcmTokens';
import {
  autoRecordEntryId,
  dateKey,
  isLaterMonth,
  monthKey,
  occurrencesInWindow,
  sameUtcDay,
  seoulMidnightToUtc,
  seoulMonthRange,
  seoulToday,
  shouldFireOn,
  type RecurringSchedule,
} from './recurrence-core';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/** 자동 기록 catch-up 창(일). cron이 며칠 빠져도 이 안의 발생분은 채운다(명세 D5). */
const AUTO_RECORD_WINDOW_DAYS = 7;

type CategoryDoc = {
  name?: string;
  group?: 'income' | 'expense';
  recurrence?: RecurringSchedule | null;
};

function buildPushBody(category: CategoryDoc, schedule: RecurringSchedule): string {
  const name = category.name ?? '정기 항목';
  const isIncome = category.group === 'income';
  const leadDays = schedule.leadDays ?? 0;
  const amount = schedule.expectedAmount;
  const amountStr =
    amount != null && amount > 0 ? ` · 약 ${Math.round(amount).toLocaleString('ko-KR')}원` : '';
  const emoji = isIncome ? '💰' : '💸';

  if (leadDays === 0) {
    const phrase = isIncome ? '들어오는 날이에요' : '내는 날이에요';
    return `오늘은 ${name} ${phrase}${amountStr} ${emoji}`;
  }
  const phrase = isIncome ? '들어올 예정이에요' : '나갈 예정이에요';
  return `${leadDays}일 후 ${name} ${phrase}${amountStr} ${emoji}`;
}

/**
 * 푸시 클릭 시 가계부 내역 추가 시트를 prefill 상태로 여는 딥링크.
 * 가계부 history 페이지가 quickAdd 쿼리를 읽어 EntryForm을 자동으로 연다.
 */
function buildQuickAddLink(category: CategoryDoc, schedule: RecurringSchedule): string {
  const isIncome = category.group === 'income';
  const params = new URLSearchParams();
  params.set('quickAdd', '1');
  params.set('qaType', isIncome ? 'income' : 'expense');
  if (category.name) params.set('qaCategory', category.name);
  const amount = schedule.expectedAmount;
  if (amount != null && amount > 0) params.set('qaAmount', String(amount));
  return `/inner/cashbook/history?${params.toString()}`;
}

/** 자동 기록 완료 알림 본문(명세 「푸시 메시지」) */
function buildAutoRecordBody(category: CategoryDoc, amount: number): string {
  const name = category.name ?? '정기 항목';
  const amountStr = `${Math.round(amount).toLocaleString('ko-KR')}원`;
  return category.group === 'income'
    ? `${name} ${amountStr}이 들어온 것으로 기록했어요 ✅`
    : `${name} ${amountStr}을 자동으로 기록했어요 ✅`;
}

type FireTarget = {
  categoryId: string;
  category: CategoryDoc;
  schedule: RecurringSchedule;
};

type AutoRecordedPush = {
  categoryId: string;
  category: CategoryDoc;
  entryId: string;
  amount: number;
};

/** 자동 기록 대상인가(명세 D1·D2): 정기 발생 on + autoRecord + 예상 금액 양수 */
function isAutoRecordTarget(schedule: RecurringSchedule): boolean {
  return (
    schedule.enabled === true &&
    schedule.autoRecord === true &&
    schedule.expectedAmount != null &&
    schedule.expectedAmount > 0
  );
}

/** 커플 멤버 중 알림이 켜진 사람들의 FCM 토큰(기존 유저는 미지정=켜짐) */
async function loadRecipientTokens(
  memberUids: string[]
): Promise<{ uid: string; tokens: TokenDoc[] }[]> {
  const out: { uid: string; tokens: TokenDoc[] }[] = [];
  for (const uid of memberUids) {
    const settingsSnap = await db.doc(`users/${uid}/settings/notifications`).get();
    const settings = settingsSnap.data();
    if (settings?.recurringTransaction?.enabled === false) continue;
    const tokenDocs = await loadUserTokenDocs(db, uid);
    if (tokenDocs.length === 0) continue;
    out.push({ uid, tokens: tokenDocs });
  }
  return out;
}

/**
 * 자동 기록 패스(명세 「Cloud Functions」 3단계).
 * autoRecord 카테고리의 최근 7일 발생분 중 아직 기록하지 않은 달에 실제 내역을 만든다.
 * 멱등성: 결정적 문서 id(create) + meta/recurringAutoRecords.lastRecordedMonth 마커(같은 batch).
 * 반환: 오늘 발생분으로 새로 만든 내역(푸시 대상). catch-up 분은 푸시하지 않는다.
 */
async function runAutoRecordPass(
  coupleId: string,
  memberUids: string[],
  targets: FireTarget[],
  today: Date
): Promise<AutoRecordedPush[]> {
  const autoTargets = targets.filter((t) => isAutoRecordTarget(t.schedule));
  if (autoTargets.length === 0) return [];

  const metaRef = db.doc(`couples/${coupleId}/meta/recurringAutoRecords`);
  const metaSnap = await metaRef.get();
  const lastRecordedMonth: Record<string, string> =
    (metaSnap.data()?.lastRecordedMonth as Record<string, string> | undefined) ?? {};

  const pushes: AutoRecordedPush[] = [];
  const entriesCol = db.collection(`couples/${coupleId}/cashbookEntries`);

  for (const t of autoTargets) {
    const occurrences = occurrencesInWindow(t.schedule, today, AUTO_RECORD_WINDOW_DAYS);
    for (const occ of occurrences) {
      const month = monthKey(occ);
      const last = lastRecordedMonth[t.categoryId];
      if (last && !isLaterMonth(month, last)) continue; // 이미 처리한 달(기록 또는 G1 skip)

      try {
        const categoryName = t.category.name ?? '';
        // G1: 같은 달 같은 카테고리(이름) 실거래가 이미 있으면 생성하지 않고 마커만 전진
        const { start, end } = seoulMonthRange(month);
        const existing = await entriesCol
          .where('category', '==', categoryName)
          .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
          .where('date', '<', admin.firestore.Timestamp.fromDate(end))
          .limit(1)
          .get();

        const batch = db.batch();
        let createdEntryId: string | null = null;

        if (existing.empty) {
          // D7: 작성자 = payerUid, 멤버가 아니면 첫 멤버로 폴백
          let createdBy = t.schedule.payerUid ?? '';
          if (!memberUids.includes(createdBy)) {
            logger.warn('recurringAutoRecord payerUid is not a member; falling back', {
              coupleId,
              categoryId: t.categoryId,
              payerUid: createdBy,
            });
            createdBy = memberUids[0];
          }

          const entryId = autoRecordEntryId(t.categoryId, month);
          const amount = Math.round(t.schedule.expectedAmount as number);
          batch.create(entriesCol.doc(entryId), {
            id: entryId,
            coupleId,
            createdBy,
            type: t.category.group === 'income' ? 'income' : 'expense',
            amount,
            category: categoryName,
            description: '',
            date: admin.firestore.Timestamp.fromDate(seoulMidnightToUtc(occ)),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            autoRecord: { categoryId: t.categoryId, month },
          });
          createdEntryId = entryId;
        }

        batch.set(
          metaRef,
          {
            lastRecordedMonth: { [t.categoryId]: month },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        await batch.commit();
        lastRecordedMonth[t.categoryId] = month;

        if (createdEntryId) {
          logger.info('recurringAutoRecord created', {
            coupleId,
            categoryId: t.categoryId,
            entryId: createdEntryId,
            occurrence: dateKey(occ),
          });
          if (sameUtcDay(occ, today)) {
            pushes.push({
              categoryId: t.categoryId,
              category: t.category,
              entryId: createdEntryId,
              amount: Math.round(t.schedule.expectedAmount as number),
            });
          }
        } else {
          logger.info('recurringAutoRecord skipped (G1: entry exists)', {
            coupleId,
            categoryId: t.categoryId,
            month,
          });
        }
      } catch (err) {
        // 결정적 id 충돌(동시 실행 등)도 여기로 온다 — 다음 실행에서 마커로 걸러진다
        logger.error('recurringAutoRecord failed', {
          coupleId,
          categoryId: t.categoryId,
          month,
          err,
        });
      }
    }
  }

  return pushes;
}

export const recurringTransactionReminder = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
  },
  async () => {
    const today = seoulToday(new Date());
    const todayStr = dateKey(today);

    // 정기 발생이 켜진 카테고리만 조회 (collection group, 전체 스캔 회피)
    const snap = await db
      .collectionGroup('cashbookCategories')
      .where('recurrence.enabled', '==', true)
      .get();

    logger.info('recurringReminder start', { today: todayStr, candidateCount: snap.size });

    // coupleId별로 모은다. 자동 기록 대상은 catch-up 때문에 오늘 발화 여부와 무관하게 전부,
    // 리마인더 대상은 오늘 알림일인 것만(autoRecord 카테고리는 리마인더 제외 — 명세 D8).
    const autoByCouple = new Map<string, FireTarget[]>();
    const reminderByCouple = new Map<string, FireTarget[]>();
    for (const doc of snap.docs) {
      const data = doc.data() as CategoryDoc;
      const schedule = data.recurrence;
      if (!schedule) continue;
      const coupleId = doc.ref.parent.parent?.id;
      if (!coupleId) continue;
      const target: FireTarget = { categoryId: doc.id, category: data, schedule };

      if (isAutoRecordTarget(schedule)) {
        const list = autoByCouple.get(coupleId) ?? [];
        list.push(target);
        autoByCouple.set(coupleId, list);
        continue;
      }
      if (!shouldFireOn(schedule, today)) continue;
      const list = reminderByCouple.get(coupleId) ?? [];
      list.push(target);
      reminderByCouple.set(coupleId, list);
    }

    const coupleIds = new Set([...autoByCouple.keys(), ...reminderByCouple.keys()]);
    if (coupleIds.size === 0) {
      logger.info('recurringReminder: no targets today', { today: todayStr });
      return;
    }

    for (const coupleId of coupleIds) {
      try {
        const coupleSnap = await db.doc(`couples/${coupleId}`).get();
        const memberUids: string[] = (coupleSnap.data()?.memberUids as string[] | undefined) ?? [];
        if (memberUids.length === 0) {
          logger.warn('recurringReminder: couple has no members', { coupleId });
          continue;
        }

        // ── 3. 자동 기록 패스 ──
        const autoPushes = await runAutoRecordPass(
          coupleId,
          memberUids,
          autoByCouple.get(coupleId) ?? [],
          today
        );

        // ── 4. 리마인더 패스 (멱등성: 오늘 이미 보낸 카테고리는 skip) ──
        const reminderTargets = reminderByCouple.get(coupleId) ?? [];
        const metaRef = db.doc(`couples/${coupleId}/meta/recurringReminders`);
        const metaSnap = await metaRef.get();
        const lastFiredOn: Record<string, string> =
          (metaSnap.data()?.lastFiredOn as Record<string, string> | undefined) ?? {};
        const pending = reminderTargets.filter((t) => lastFiredOn[t.categoryId] !== todayStr);

        if (pending.length === 0 && autoPushes.length === 0) continue;

        // ── 5. 발송 ──
        const recipients = await loadRecipientTokens(memberUids);
        for (const { uid, tokens } of recipients) {
          for (const t of pending) {
            try {
              // 발송 후 무효 토큰은 자동 정리된다(sendAndPrune).
              const res = await sendAndPrune(messaging, tokens, {
                notification: {
                  title: '말랑 가계부',
                  body: buildPushBody(t.category, t.schedule),
                },
                data: {
                  click_action: buildQuickAddLink(t.category, t.schedule),
                  categoryId: t.categoryId,
                  kind: 'recurringTransaction',
                },
              });
              logger.info('recurringReminder FCM sent', {
                coupleId,
                uid,
                categoryId: t.categoryId,
                successCount: res?.successCount,
                failureCount: res?.failureCount,
              });
            } catch (err) {
              logger.error('recurringReminder FCM send failed', { coupleId, uid, err });
            }
          }

          for (const p of autoPushes) {
            try {
              const res = await sendAndPrune(messaging, tokens, {
                notification: {
                  title: '말랑 가계부',
                  body: buildAutoRecordBody(p.category, p.amount),
                },
                data: {
                  click_action: `/inner/cashbook/history?entryId=${encodeURIComponent(p.entryId)}`,
                  categoryId: p.categoryId,
                  entryId: p.entryId,
                  kind: 'recurringAutoRecord',
                },
              });
              logger.info('recurringAutoRecord FCM sent', {
                coupleId,
                uid,
                categoryId: p.categoryId,
                entryId: p.entryId,
                successCount: res?.successCount,
                failureCount: res?.failureCount,
              });
            } catch (err) {
              logger.error('recurringAutoRecord FCM send failed', { coupleId, uid, err });
            }
          }
        }

        // 리마인더 발송 처리한 카테고리를 오늘 날짜로 마킹
        if (pending.length > 0) {
          const nextLastFiredOn = { ...lastFiredOn };
          for (const t of pending) nextLastFiredOn[t.categoryId] = todayStr;
          await metaRef.set(
            {
              lastFiredOn: nextLastFiredOn,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err) {
        logger.error('recurringReminder couple processing failed', { coupleId, err });
      }
    }
  }
);
