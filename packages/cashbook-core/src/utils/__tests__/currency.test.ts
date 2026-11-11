import { describe, expect, it } from 'vitest';
import { formatAmount, formatCurrency, toWonAmount } from '../currency';

describe('formatCurrency', () => {
  it('정수 금액은 천 단위 콤마로 표기한다', () => {
    expect(formatCurrency(1234567)).toBe('1,234,567원');
  });

  it('소수 금액은 원 단위로 반올림해 소수점을 표기하지 않는다', () => {
    expect(formatCurrency(-878958.007)).toBe('-878,958원');
    expect(formatCurrency(1000.5)).toBe('1,001원');
  });

  it('반올림 결과가 0이면 -0이 아닌 0으로 표기한다', () => {
    expect(formatCurrency(-0.4)).toBe('0원');
  });

  it('en 로케일은 ₩ 접두 표기를 쓰고 부호는 ₩ 앞에 둔다', () => {
    expect(formatCurrency(1234567, 'en')).toBe('₩1,234,567');
    expect(formatCurrency(-878958.007, 'en')).toBe('-₩878,958');
    expect(formatCurrency(-0.4, 'en')).toBe('₩0');
  });
});

describe('formatAmount', () => {
  it('부호 접두사와 함께 원 단위로 반올림해 표기한다', () => {
    expect(formatAmount(12000.007, 'expense')).toBe('-12,000원');
    expect(formatAmount(12000.007, 'income')).toBe('+12,000원');
  });

  it('en 로케일은 부호 뒤에 ₩ 를 붙인다', () => {
    expect(formatAmount(12000.007, 'expense', 'en')).toBe('-₩12,000');
    expect(formatAmount(12000.007, 'income', 'en')).toBe('+₩12,000');
  });
});

describe('toWonAmount', () => {
  it('원 단위 정수로 반올림한다', () => {
    expect(toWonAmount(12000.007)).toBe(12000);
    expect(toWonAmount(-878958.5)).toBe(-878958);
  });

  it('-0 대신 0을 돌려준다', () => {
    expect(Object.is(toWonAmount(-0.4), 0)).toBe(true);
  });
});
