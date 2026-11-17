import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { Sheet } from '@uandi/ui';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import { PlanWizardStepSheet, type WizardStepSheetRow } from './PlanWizardStepSheet';

const ts = Timestamp.now();

function row(
  id: string,
  name: string,
  icon: string,
  group: AnnualPlanItem['group'],
  subGroup: AnnualPlanItem['subGroup'],
  monthlyAmounts: number[],
  usesAvg: boolean
): WizardStepSheetRow {
  const regular = subGroup === 'regular_income' || subGroup === 'fixed_expense';
  const category: CashbookCategory = {
    id,
    coupleId: 'c',
    name,
    icon,
    color: group === 'income' ? '#4CAF86' : '#D8635A',
    group,
    subGroup,
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '',
    examples: [],
    createdAt: ts,
  };
  const item: AnnualPlanItem = {
    id,
    planId: 'p',
    coupleId: 'c',
    categoryId: id,
    group,
    subGroup,
    monthlyAmounts,
    annualAmount: monthlyAmounts.reduce((s, v) => s + v, 0),
    inputMode: regular ? 'regular' : 'irregular',
    baseMonthlyAmount: regular ? (monthlyAmounts[0] ?? 0) : null,
    ownerUid: null,
    updatedAt: ts,
  };
  return { item, category, usesAvg };
}

const m = (v: number) => Array(12).fill(v);

/** 빠른 모드: 정기 수입 · 고정 지출 · 공통 변동 지출, 모두 월 평균 */
const quickRows: WizardStepSheetRow[] = [
  row('i1', '정기급여', 'wallet', 'income', 'regular_income', m(5_000_000), true),
  row('i2', '상여', 'gift', 'income', 'regular_income', m(0), true),
  row('e1', '월세', 'house', 'expense', 'fixed_expense', m(800_000), true),
  row('e2', '보험', 'shield_check', 'expense', 'fixed_expense', m(200_000), true),
  row('e3', '정기결제', 'arrows_clockwise', 'expense', 'fixed_expense', m(180_000), true),
  row('e4', '식비', 'bowl_food', 'expense', 'variable_common', m(0), true),
  row('e5', '여행', 'airplane', 'expense', 'variable_common', m(0), true),
];

/** 전체 모드: 비정기 수입은 달마다 달라 연 금액으로 */
const fullRows: WizardStepSheetRow[] = [
  quickRows[0],
  quickRows[1],
  row(
    'i3',
    '인센티브',
    'trophy',
    'income',
    'irregular_income',
    [0, 0, 0, 0, 2_000_000, 0, 0, 0, 0, 0, 0, 3_000_000],
    false
  ),
  row('i4', '부업', 'briefcase', 'income', 'irregular_income', m(0), false),
  ...quickRows.slice(2),
  row('e6', '교통', 'bus', 'expense', 'variable_personal', m(70_000), false),
  row(
    'e7',
    '아주 긴 이름의 개인 취미 생활 카테고리',
    'gift',
    'expense',
    'variable_personal',
    m(0),
    false
  ),
];

const meta: Meta<typeof PlanWizardStepSheet> = {
  title: 'Cashbook/PlanWizard/StepSheet',
  component: PlanWizardStepSheet,
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    onSelect: (target) => console.log('select', target),
  },
};

export default meta;
type Story = StoryObj<typeof PlanWizardStepSheet>;

/** 빠른 모드, "정기결제"에 있을 때 (스크린샷 상황) */
export const QuickMid: Story = {
  args: {
    rows: quickRows,
    current: { kind: 'item', itemId: 'e3' },
    validationOk: true,
  },
};

/** 전체 모드 — 비정기 항목은 "연 …", 긴 이름은 말줄임 */
export const FullMode: Story = {
  args: {
    rows: fullRows,
    current: { kind: 'item', itemId: 'i3' },
    validationOk: true,
  },
};

/** 지출이 수입보다 많아 검증을 통과하지 못한 상태 — "완료"에 안내 문구 */
export const ValidationFailed: Story = {
  args: {
    rows: quickRows.map((r) =>
      r.item.subGroup === 'regular_income'
        ? { ...r, item: { ...r.item, monthlyAmounts: m(0), baseMonthlyAmount: 0, annualAmount: 0 } }
        : r
    ),
    current: { kind: 'validate' },
    validationOk: false,
  },
};

/** 아직 아무것도 적지 않았을 때 — 모두 "—" */
export const AllEmpty: Story = {
  args: {
    rows: quickRows.map((r) => ({
      ...r,
      item: { ...r.item, monthlyAmounts: m(0), baseMonthlyAmount: 0, annualAmount: 0 },
    })),
    current: { kind: 'item', itemId: 'i1' },
    validationOk: true,
  },
};

/** 항목이 하나도 없을 때 */
export const NoItems: Story = {
  args: {
    rows: [],
    current: { kind: 'summary' },
    validationOk: true,
  },
};
