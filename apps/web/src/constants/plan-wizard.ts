import type { CategorySubGroup } from '@uandi/cashbook-core';

/**
 * 위저드에서 "정기" 흐름(평균 입력 → 그리드 조정 2화면) 으로 다루는 subGroup.
 * 그 외(irregular_income / variable_common / variable_personal)는
 * 1화면 그리드 + 균등채우기 토글 흐름.
 */
export const REGULAR_SUBGROUPS = new Set<CategorySubGroup>(['regular_income', 'fixed_expense']);

export function isRegularSubGroup(subGroup: CategorySubGroup): boolean {
  return REGULAR_SUBGROUPS.has(subGroup);
}

/**
 * 위저드 모드.
 * - quick: 정기 수입·고정 지출·공통 변동 지출만, 항목마다 월 평균 1화면(그리드 없음). 권유 카드의 "약 5분".
 * - full: 모든 항목, 정기 항목은 평균 → 그리드 2화면.
 */
export const WIZARD_MODES = ['quick', 'full'] as const;
export type WizardMode = (typeof WIZARD_MODES)[number];
export const DEFAULT_WIZARD_MODE: WizardMode = 'quick';

export function isWizardMode(v: unknown): v is WizardMode {
  return v === 'quick' || v === 'full';
}

/** 빠른 모드에 포함하는 subGroup */
export const QUICK_MODE_SUBGROUPS = new Set<CategorySubGroup>([
  'regular_income',
  'fixed_expense',
  'variable_common',
]);

export const WIZARD_MODE_LABEL: Record<WizardMode, { title: string; description: string }> = {
  quick: {
    title: '핵심만 빠르게',
    description: '월급·고정 지출·함께 쓰는 변동 지출만 월 평균으로. 약 5분',
  },
  full: {
    title: '전체 항목 꼼꼼히',
    description: '모든 카테고리를 월별로 조정하면서. 약 20분',
  },
};

export const WIZARD_GROUP_ORDER = ['income', 'expense'] as const;
export type WizardGroup = (typeof WIZARD_GROUP_ORDER)[number];

export const WIZARD_GROUP_LABEL: Record<WizardGroup, string> = {
  income: '수입',
  expense: '지출',
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
