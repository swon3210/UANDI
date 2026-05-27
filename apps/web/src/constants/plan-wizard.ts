import type { CategorySubGroup } from '@uandi/cashbook-core';

/**
 * 위저드에서 "정기" 흐름(평균 입력 → 그리드 조정 2화면) 으로 다루는 subGroup.
 * 그 외(irregular_income / variable_common / variable_personal / joint_flex / personal_flex)는
 * 1화면 그리드 + 균등채우기 토글 흐름.
 */
export const REGULAR_SUBGROUPS = new Set<CategorySubGroup>(['regular_income', 'fixed_expense']);

export function isRegularSubGroup(subGroup: CategorySubGroup): boolean {
  return REGULAR_SUBGROUPS.has(subGroup);
}

export const WIZARD_GROUP_ORDER = ['income', 'expense', 'flex'] as const;
export type WizardGroup = (typeof WIZARD_GROUP_ORDER)[number];

export const WIZARD_GROUP_LABEL: Record<WizardGroup, string> = {
  income: '수입',
  expense: '지출',
  flex: 'Flex',
};

export const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];
