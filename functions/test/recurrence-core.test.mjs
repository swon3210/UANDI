// 정기 발생 순수 함수 단위 테스트 (docs/pages/inner/cashbook-recurring-auto-record.md 「단위 테스트」).
// 실행: cd functions && npm test  (tsc 빌드 후 lib/ 산출물을 돌린다 — 추가 의존성 없음)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  autoRecordEntryId,
  isLaterMonth,
  monthKey,
  occurrencesInWindow,
  occurrenceDate,
  seoulMidnightToUtc,
  seoulMonthRange,
  shouldFireOn,
} from '../lib/notifications/recurrence-core.js';

const utc = (y, m1, d) => new Date(Date.UTC(y, m1 - 1, d));
const keys = (dates) => dates.map((d) => d.toISOString().slice(0, 10));

const monthly25 = { enabled: true, kind: 'dayOfMonth', dayOfMonth: 25 };

test('occurrencesInWindow: 발생일 당일은 포함, 하루 전은 비어 있다', () => {
  assert.deepEqual(keys(occurrencesInWindow(monthly25, utc(2026, 11, 25), 7)), ['2026-11-25']);
  assert.deepEqual(keys(occurrencesInWindow(monthly25, utc(2026, 11, 24), 7)), []);
});

test('occurrencesInWindow: catch-up — 발생 2일 뒤에도 잡히고, 7일 창을 벗어나면 빠진다', () => {
  assert.deepEqual(keys(occurrencesInWindow(monthly25, utc(2026, 11, 27), 7)), ['2026-11-25']);
  // 25일 발생, today=12/1 → 창은 11/25~12/1 (7일) → 포함
  assert.deepEqual(keys(occurrencesInWindow(monthly25, utc(2026, 12, 1), 7)), ['2026-11-25']);
  // today=12/2 → 창은 11/26~12/2 → 제외
  assert.deepEqual(keys(occurrencesInWindow(monthly25, utc(2026, 12, 2), 7)), []);
});

test('occurrencesInWindow: 미래 발생일은 절대 포함하지 않는다', () => {
  assert.deepEqual(keys(occurrencesInWindow(monthly25, utc(2026, 11, 20), 30)), ['2026-10-25']);
});

test('occurrencesInWindow: enabled=false 또는 창 0이면 비어 있다', () => {
  assert.deepEqual(occurrencesInWindow({ ...monthly25, enabled: false }, utc(2026, 11, 25), 7), []);
  assert.deepEqual(occurrencesInWindow(monthly25, utc(2026, 11, 25), 0), []);
});

test('dayOfMonth=31은 2월엔 말일로 clamp 된다', () => {
  const s = { enabled: true, kind: 'dayOfMonth', dayOfMonth: 31 };
  assert.equal(occurrenceDate(s, 2026, 1).toISOString().slice(0, 10), '2026-02-28');
  assert.equal(occurrenceDate(s, 2028, 1).toISOString().slice(0, 10), '2028-02-29');
  assert.deepEqual(keys(occurrencesInWindow(s, utc(2026, 2, 28), 7)), ['2026-02-28']);
});

test('intervalMonths=2 + anchorMonth: 위상이 맞지 않는 달은 건너뛴다', () => {
  const s = { ...monthly25, intervalMonths: 2, anchorMonth: '2026-07' };
  // 7·9·11월 발생, 10월은 건너뜀
  assert.equal(occurrenceDate(s, 2026, 9), null);
  assert.deepEqual(keys(occurrencesInWindow(s, utc(2026, 10, 25), 7)), []);
  assert.deepEqual(keys(occurrencesInWindow(s, utc(2026, 11, 25), 7)), ['2026-11-25']);
});

test('nthWeekday week=-1: 마지막 주 요일을 정확히 계산한다', () => {
  // 2026-11의 마지막 금요일 = 11/27 (weekday 5=금)
  const s = { enabled: true, kind: 'nthWeekday', week: -1, weekday: 5 };
  assert.equal(occurrenceDate(s, 2026, 10).toISOString().slice(0, 10), '2026-11-27');
  // 둘째 주 수요일(3) = 11/11
  const s2 = { enabled: true, kind: 'nthWeekday', week: 2, weekday: 3 };
  assert.equal(occurrenceDate(s2, 2026, 10).toISOString().slice(0, 10), '2026-11-11');
});

test('월 경계: 10/31 발생을 11/2에 되짚으면 monthKey는 2026-10', () => {
  const s = { enabled: true, kind: 'dayOfMonth', dayOfMonth: 31 };
  const occ = occurrencesInWindow(s, utc(2026, 11, 2), 7);
  assert.deepEqual(keys(occ), ['2026-10-31']);
  assert.equal(monthKey(occ[0]), '2026-10');
});

test('isLaterMonth / autoRecordEntryId', () => {
  assert.equal(isLaterMonth('2026-11', '2026-10'), true);
  assert.equal(isLaterMonth('2026-10', '2026-10'), false);
  assert.equal(isLaterMonth('2027-01', '2026-12'), true);
  assert.equal(autoRecordEntryId('cat1', '2026-11'), 'recurrence-cat1-2026-11');
});

test('seoulMidnightToUtc: KST 자정은 전날 15:00Z', () => {
  assert.equal(seoulMidnightToUtc(utc(2026, 11, 25)).toISOString(), '2026-11-24T15:00:00.000Z');
});

test('seoulMonthRange: 달 전체를 KST 기준으로 덮는다(연말 포함)', () => {
  const nov = seoulMonthRange('2026-11');
  assert.equal(nov.start.toISOString(), '2026-10-31T15:00:00.000Z');
  assert.equal(nov.end.toISOString(), '2026-11-30T15:00:00.000Z');
  const dec = seoulMonthRange('2026-12');
  assert.equal(dec.end.toISOString(), '2026-12-31T15:00:00.000Z');
});

test('shouldFireOn(리마인더): leadDays로 전월 말에 발화한다 — 기존 동작 회귀 확인', () => {
  const s = { enabled: true, kind: 'dayOfMonth', dayOfMonth: 1, leadDays: 3 };
  assert.equal(shouldFireOn(s, utc(2026, 10, 29)), true); // 11/1 - 3일
  assert.equal(shouldFireOn(s, utc(2026, 10, 28)), false);
  assert.equal(shouldFireOn({ ...s, enabled: false }, utc(2026, 10, 29)), false);
});
