import type { CategoryGroup } from '@/types';

export type GoalCategoryKey = 'income' | 'expense' | 'investment' | 'flex';

export type GoalCategoryTheme = {
  key: GoalCategoryKey;
  group: CategoryGroup;
  label: string;
  goalLabel: string;
  emoji: string;
  /** 카테고리 메인 컬러 (텍스트, 진행률 바) */
  accentClass: string;
  /** 카테고리 메인 컬러 (background) */
  accentBgClass: string;
  /** 카테고리 메인 컬러 (border) */
  accentBorderClass: string;
  /** 옅은 배경 (카드 영역, 아이콘 배경) */
  softBgClass: string;
  /** 옅은 border */
  softBorderClass: string;
  /** Hero 카드 그라디언트 (수입은 sage, 그 외는 coral 베이스) */
  heroGradientFrom: string;
  heroGradientTo: string;
};

export const GOAL_CATEGORIES: GoalCategoryTheme[] = [
  {
    key: 'income',
    group: 'income',
    label: '수입',
    goalLabel: '연간 수입 목표',
    emoji: '💰',
    accentClass: 'text-sage-400',
    accentBgClass: 'bg-sage-400',
    accentBorderClass: 'border-sage-400',
    softBgClass: 'bg-sage-50',
    softBorderClass: 'border-sage-100',
    heroGradientFrom: 'from-sage-400',
    heroGradientTo: 'to-sage-500',
  },
  {
    key: 'expense',
    group: 'expense',
    label: '지출',
    goalLabel: '연간 지출 한도',
    emoji: '🛒',
    accentClass: 'text-coral-500',
    accentBgClass: 'bg-coral-500',
    accentBorderClass: 'border-coral-500',
    softBgClass: 'bg-coral-50',
    softBorderClass: 'border-coral-100',
    heroGradientFrom: 'from-coral-400',
    heroGradientTo: 'to-coral-500',
  },
  {
    key: 'investment',
    group: 'investment',
    label: '재테크',
    goalLabel: '연간 투자 목표',
    emoji: '📈',
    accentClass: 'text-amber-500',
    accentBgClass: 'bg-amber-400',
    accentBorderClass: 'border-amber-400',
    softBgClass: 'bg-amber-50',
    softBorderClass: 'border-amber-100',
    heroGradientFrom: 'from-amber-400',
    heroGradientTo: 'to-amber-500',
  },
  {
    key: 'flex',
    group: 'flex',
    label: 'Flex',
    goalLabel: '연간 Flex 한도',
    emoji: '✨',
    accentClass: 'text-violet-500',
    accentBgClass: 'bg-violet-400',
    accentBorderClass: 'border-violet-400',
    softBgClass: 'bg-violet-50',
    softBorderClass: 'border-violet-100',
    heroGradientFrom: 'from-violet-400',
    heroGradientTo: 'to-violet-500',
  },
];

export const GOAL_CATEGORY_BY_KEY: Record<GoalCategoryKey, GoalCategoryTheme> =
  GOAL_CATEGORIES.reduce(
    (acc, c) => {
      acc[c.key] = c;
      return acc;
    },
    {} as Record<GoalCategoryKey, GoalCategoryTheme>
  );
