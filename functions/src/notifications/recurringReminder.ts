import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

type RecurringSchedule = {
  enabled: boolean;
  kind: 'dayOfMonth' | 'nthWeekday';
  dayOfMonth?: number;
  week?: number;
  weekday?: number;
  leadDays?: number;
  expectedAmount?: number | null;
};

type CategoryDoc = {
  name?: string;
  group?: 'income' | 'expense' | 'flex';
  recurrence?: RecurringSchedule | null;
};

// ── 날짜 유틸 (의존성 없이 plain Date, 모든 계산은 UTC 캘린더 기준) ──

function utcDate(year: number, month0: number, day: number): Date {
  return new Date(Date.UTC(year, month0, day));
}

function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** 내부 컨벤션(1=월~7=일) → JS getUTCDay 컨벤션(0=일~6=토) */
function toJsDow(weekday: number): number {
  return weekday % 7;
}

/** Asia/Seoul 기준 '오늘'의 캘린더 날짜를 UTC 자정 Date로 반환 */
function seoulToday(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return utcDate(get('year'), get('month') - 1, get('day'));
}

function occurrenceDate(schedule: RecurringSchedule, year: number, month0: number): Date | null {
  if (schedule.kind === 'dayOfMonth') {
    const target = schedule.dayOfMonth;
    if (!target || target < 1) return null;
    const day = Math.min(target, daysInMonth(year, month0));
    return utcDate(year, month0, day);
  }

  const { week, weekday } = schedule;
  if (!week || !weekday) return null;
  const targetDow = toJsDow(weekday);

  if (week === -1) {
    const lastDay = daysInMonth(year, month0);
    const lastDate = utcDate(year, month0, lastDay);
    const lastOffset = (lastDate.getUTCDay() - targetDow + 7) % 7;
    return utcDate(year, month0, lastDay - lastOffset);
  }

  const first = utcDate(year, month0, 1);
  const firstOffset = (targetDow - first.getUTCDay() + 7) % 7;
  const day = 1 + firstOffset + (week - 1) * 7;
  if (day > daysInMonth(year, month0)) return null;
  return utcDate(year, month0, day);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

function sameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** today(UTC 자정 캘린더 날짜) 기준으로 이 스케줄이 오늘 알림을 보내야 하는지 */
export function shouldFireOn(schedule: RecurringSchedule, today: Date): boolean {
  if (!schedule.enabled) return false;
  const leadDays = schedule.leadDays ?? 0;
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const candidates = [
    occurrenceDate(schedule, y, m),
    occurrenceDate(schedule, m === 11 ? y + 1 : y, (m + 1) % 12),
  ];
  return candidates.some((occ) => occ != null && sameUtcDay(addDays(occ, -leadDays), today));
}

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildPushBody(category: CategoryDoc, schedule: RecurringSchedule): string {
  const name = category.name ?? '정기 항목';
  const isIncome = category.group === 'income';
  const leadDays = schedule.leadDays ?? 0;
  const amount = schedule.expectedAmount;
  const amountStr = amount != null && amount > 0 ? ` · 약 ${amount.toLocaleString('ko-KR')}원` : '';
  const emoji = isIncome ? '💰' : '💸';

  if (leadDays === 0) {
    const phrase = isIncome ? '들어오는 날이에요' : '내는 날이에요';
    return `오늘은 ${name} ${phrase}${amountStr} ${emoji}`;
  }
  const phrase = isIncome ? '들어올 예정이에요' : '나갈 예정이에요';
  return `${leadDays}일 후 ${name} ${phrase}${amountStr} ${emoji}`;
}

type FireTarget = {
  categoryId: string;
  category: CategoryDoc;
  schedule: RecurringSchedule;
};

export const recurringTransactionReminder = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
  },
  async () => {
    const today = seoulToday(new Date());
    const todayStr = dateKey(today);

    // 정기 알림이 켜진 카테고리만 조회 (collection group, 전체 스캔 회피)
    const snap = await db
      .collectionGroup('cashbookCategories')
      .where('recurrence.enabled', '==', true)
      .get();

    logger.info('recurringReminder start', { today: todayStr, candidateCount: snap.size });

    // coupleId별로 오늘 발화할 카테고리를 모은다
    const byCouple = new Map<string, FireTarget[]>();
    for (const doc of snap.docs) {
      const data = doc.data() as CategoryDoc;
      const schedule = data.recurrence;
      if (!schedule) continue;
      if (!shouldFireOn(schedule, today)) continue;

      const coupleId = doc.ref.parent.parent?.id;
      if (!coupleId) continue;

      const list = byCouple.get(coupleId) ?? [];
      list.push({ categoryId: doc.id, category: data, schedule });
      byCouple.set(coupleId, list);
    }

    if (byCouple.size === 0) {
      logger.info('recurringReminder: no targets today', { today: todayStr });
      return;
    }

    for (const [coupleId, targets] of byCouple) {
      try {
        // 멱등성: 오늘 이미 보낸 카테고리는 skip
        const metaRef = db.doc(`couples/${coupleId}/meta/recurringReminders`);
        const metaSnap = await metaRef.get();
        const lastFiredOn: Record<string, string> =
          (metaSnap.data()?.lastFiredOn as Record<string, string> | undefined) ?? {};

        const pending = targets.filter((t) => lastFiredOn[t.categoryId] !== todayStr);
        if (pending.length === 0) continue;

        const coupleSnap = await db.doc(`couples/${coupleId}`).get();
        const memberUids: string[] = (coupleSnap.data()?.memberUids as string[] | undefined) ?? [];
        if (memberUids.length === 0) {
          logger.warn('recurringReminder: couple has no members', { coupleId });
          continue;
        }

        for (const uid of memberUids) {
          const settingsSnap = await db.doc(`users/${uid}/settings/notifications`).get();
          const settings = settingsSnap.data();
          // 미지정(기존 유저)은 켜진 것으로 간주, 명시적 false만 skip
          if (settings?.recurringTransaction?.enabled === false) continue;

          const tokensSnap = await db.collection(`users/${uid}/fcmTokens`).get();
          const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);
          if (tokens.length === 0) continue;

          for (const t of pending) {
            try {
              const res = await messaging.sendEachForMulticast({
                tokens,
                notification: { title: 'UANDI 가계부', body: buildPushBody(t.category, t.schedule) },
                data: {
                  click_action: '/cashbook/history/monthly',
                  categoryId: t.categoryId,
                  kind: 'recurringTransaction',
                },
              });
              logger.info('recurringReminder FCM sent', {
                coupleId,
                uid,
                categoryId: t.categoryId,
                successCount: res.successCount,
                failureCount: res.failureCount,
              });
            } catch (err) {
              logger.error('recurringReminder FCM send failed', { coupleId, uid, err });
            }
          }
        }

        // 발송 처리한 카테고리를 오늘 날짜로 마킹
        const nextLastFiredOn = { ...lastFiredOn };
        for (const t of pending) nextLastFiredOn[t.categoryId] = todayStr;
        await metaRef.set(
          { lastFiredOn: nextLastFiredOn, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        logger.error('recurringReminder couple processing failed', { coupleId, err });
      }
    }
  }
);
