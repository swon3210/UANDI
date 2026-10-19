import { describe, expect, it } from 'vitest';
import {
  hasInvalidRecurrence,
  planInvalidRecurrenceCleanup,
  type RecurrenceCleanupCategory,
} from '../recurrence-cleanup';

const schedule = { enabled: true, kind: 'dayOfMonth' as const, dayOfMonth: 15 };

const cat = (over: Partial<RecurrenceCleanupCategory>): RecurrenceCleanupCategory => ({
  id: 'c',
  subGroup: 'variable_common',
  recurrence: null,
  ...over,
});

describe('hasInvalidRecurrence', () => {
  it('변동 지출·비정기 수입에 recurrence가 있으면 잘못된 데이터로 본다', () => {
    expect(hasInvalidRecurrence(cat({ subGroup: 'variable_common', recurrence: schedule }))).toBe(
      true
    );
    expect(hasInvalidRecurrence(cat({ subGroup: 'variable_personal', recurrence: schedule }))).toBe(
      true
    );
    expect(hasInvalidRecurrence(cat({ subGroup: 'irregular_income', recurrence: schedule }))).toBe(
      true
    );
  });

  it('enabled가 false여도 변동 카테고리에 남아 있으면 제거 대상이다', () => {
    expect(hasInvalidRecurrence(cat({ recurrence: { ...schedule, enabled: false } }))).toBe(true);
  });

  it('고정 지출·정기 수입의 recurrence는 정상이다', () => {
    expect(hasInvalidRecurrence(cat({ subGroup: 'fixed_expense', recurrence: schedule }))).toBe(
      false
    );
    expect(hasInvalidRecurrence(cat({ subGroup: 'regular_income', recurrence: schedule }))).toBe(
      false
    );
  });

  it('recurrence가 없거나 null이면 대상이 아니다(멱등)', () => {
    expect(hasInvalidRecurrence(cat({ recurrence: null }))).toBe(false);
    expect(hasInvalidRecurrence(cat({ recurrence: undefined }))).toBe(false);
  });
});

describe('planInvalidRecurrenceCleanup', () => {
  it('잘못 붙은 카테고리 id만 돌려준다', () => {
    const ids = planInvalidRecurrenceCleanup([
      cat({ id: 'bad-1', subGroup: 'variable_common', recurrence: schedule }),
      cat({ id: 'ok-fixed', subGroup: 'fixed_expense', recurrence: schedule }),
      cat({ id: 'ok-null', subGroup: 'variable_personal', recurrence: null }),
      cat({ id: 'bad-2', subGroup: 'irregular_income', recurrence: schedule }),
    ]);
    expect(ids).toEqual(['bad-1', 'bad-2']);
  });
});
