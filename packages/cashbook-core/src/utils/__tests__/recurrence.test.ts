import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { RecurringSchedule } from '../../types';
import {
  formatRecurrence,
  isActiveMonth,
  occurrenceDateInMonth,
  shouldFireOn,
} from '../recurrence';

function monthly(dayOfMonth: number, extra: Partial<RecurringSchedule> = {}): RecurringSchedule {
  return { enabled: true, kind: 'dayOfMonth', dayOfMonth, ...extra };
}

describe('isActiveMonth — 반복 주기 위상', () => {
  it('interval 미지정/1이면 모든 달이 발생', () => {
    const s = monthly(25);
    for (let m = 0; m < 12; m++) {
      expect(isActiveMonth(s, dayjs(new Date(2026, m, 1)))).toBe(true);
    }
  });

  it('격월(interval=2) — anchor 달과 같은 위상만 발생, 사이 달은 건너뜀', () => {
    const s = monthly(25, { intervalMonths: 2, anchorMonth: '2026-07' });
    // 7월(anchor) 발생, 8월 건너뜀, 9월 발생, 10월 건너뜀 …
    expect(isActiveMonth(s, dayjs(new Date(2026, 6, 10)))).toBe(true); // 7월
    expect(isActiveMonth(s, dayjs(new Date(2026, 7, 10)))).toBe(false); // 8월
    expect(isActiveMonth(s, dayjs(new Date(2026, 8, 10)))).toBe(true); // 9월
    expect(isActiveMonth(s, dayjs(new Date(2026, 9, 10)))).toBe(false); // 10월
  });

  it('격월 — anchor 이전 달도 위상으로 판정(연 경계 넘김)', () => {
    const s = monthly(25, { intervalMonths: 2, anchorMonth: '2026-07' });
    // 2026-07 위상: 홀수 인덱스 차이. 2026-05는 -2 → 발생, 2026-06은 -1 → 건너뜀.
    expect(isActiveMonth(s, dayjs(new Date(2026, 4, 10)))).toBe(true); // 5월
    expect(isActiveMonth(s, dayjs(new Date(2026, 5, 10)))).toBe(false); // 6월
    // 연 경계: 2025-11은 anchor 대비 -8 → 짝수 → 발생.
    expect(isActiveMonth(s, dayjs(new Date(2025, 10, 10)))).toBe(true); // 2025-11
    expect(isActiveMonth(s, dayjs(new Date(2025, 11, 10)))).toBe(false); // 2025-12
  });

  it('분기(interval=3) — anchor부터 3개월마다', () => {
    const s = monthly(1, { intervalMonths: 3, anchorMonth: '2026-01' });
    expect(isActiveMonth(s, dayjs(new Date(2026, 0, 1)))).toBe(true); // 1월
    expect(isActiveMonth(s, dayjs(new Date(2026, 1, 1)))).toBe(false); // 2월
    expect(isActiveMonth(s, dayjs(new Date(2026, 3, 1)))).toBe(true); // 4월
    expect(isActiveMonth(s, dayjs(new Date(2026, 9, 1)))).toBe(true); // 10월
  });
});

describe('occurrenceDateInMonth — interval 반영', () => {
  it('격월: 발생하는 달은 날짜, 건너뛰는 달은 null', () => {
    const s = monthly(25, { intervalMonths: 2, anchorMonth: '2026-07' });
    expect(occurrenceDateInMonth(s, dayjs(new Date(2026, 6, 1)))?.date()).toBe(25); // 7월 25일
    expect(occurrenceDateInMonth(s, dayjs(new Date(2026, 7, 1)))).toBeNull(); // 8월 건너뜀
    expect(occurrenceDateInMonth(s, dayjs(new Date(2026, 8, 1)))?.date()).toBe(25); // 9월 25일
  });

  it('매월(기본)은 종전과 동일하게 매달 발생 + 말일 clamp 유지', () => {
    const s = monthly(31);
    expect(occurrenceDateInMonth(s, dayjs(new Date(2026, 1, 1)))?.date()).toBe(28); // 2월 → 28일
    expect(occurrenceDateInMonth(s, dayjs(new Date(2026, 0, 1)))?.date()).toBe(31); // 1월 → 31일
  });
});

describe('shouldFireOn — 격월은 건너뛰는 달에 알림 안 감', () => {
  it('격월 상여: 발생월엔 발화, 건너뛰는 달엔 발화 안 함', () => {
    const s = monthly(25, { intervalMonths: 2, anchorMonth: '2026-07', leadDays: 0 });
    expect(shouldFireOn(s, dayjs(new Date(2026, 6, 25)))).toBe(true); // 7/25 발생일
    expect(shouldFireOn(s, dayjs(new Date(2026, 7, 25)))).toBe(false); // 8/25 건너뜀
    expect(shouldFireOn(s, dayjs(new Date(2026, 8, 25)))).toBe(true); // 9/25 발생일
  });
});

describe('formatRecurrence — 주기 라벨', () => {
  it('매월은 접두 없이, 격월/분기는 접두 포함', () => {
    expect(formatRecurrence(monthly(25))).toBe('매월 25일');
    expect(formatRecurrence(monthly(25, { intervalMonths: 2, anchorMonth: '2026-07' }))).toBe(
      '격월 25일'
    );
    expect(formatRecurrence(monthly(25, { intervalMonths: 3, anchorMonth: '2026-01' }))).toBe(
      '분기마다 25일'
    );
    expect(formatRecurrence(monthly(25, { intervalMonths: 12, anchorMonth: '2026-01' }))).toBe(
      '매년 25일'
    );
  });

  it('nthWeekday: 매월은 접두 생략, 격월은 접두 포함', () => {
    const base: RecurringSchedule = { enabled: true, kind: 'nthWeekday', week: 2, weekday: 3 };
    expect(formatRecurrence(base)).toBe('둘째 주 수요일');
    expect(formatRecurrence({ ...base, intervalMonths: 2, anchorMonth: '2026-07' })).toBe(
      '격월 둘째 주 수요일'
    );
  });
});
