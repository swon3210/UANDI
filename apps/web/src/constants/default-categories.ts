import type { CategoryGroup, CategorySubGroup } from '@/types';

export type DefaultCategory = {
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
};

export const SUB_GROUP_LABELS: Record<CategorySubGroup, string> = {
  regular_income: '정기 수입',
  irregular_income: '비정기 수입',
  fixed_expense: '고정 지출',
  variable_common: '변동 지출 (공통)',
  variable_personal: '변동 지출 (각자)',
  cash_holding: '현금 보유',
  investment: '투자',
  joint_flex: '공동 Flex',
  personal_flex: '각자 Flex',
};

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  income: '수입',
  expense: '지출',
  investment: '재테크',
  flex: 'Flex',
};

export const SUB_GROUPS_BY_GROUP: Record<CategoryGroup, CategorySubGroup[]> = {
  income: ['regular_income', 'irregular_income'],
  expense: ['fixed_expense', 'variable_common', 'variable_personal'],
  investment: ['cash_holding', 'investment'],
  flex: ['joint_flex', 'personal_flex'],
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // ── 수입: 정기 ──
  {
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    color: '#4CAF86',
    sortOrder: 0,
  },
  {
    group: 'income',
    subGroup: 'regular_income',
    name: '상여',
    icon: 'gift',
    color: '#4CAF86',
    sortOrder: 1,
  },
  // ── 수입: 비정기 ──
  {
    group: 'income',
    subGroup: 'irregular_income',
    name: '인센티브',
    icon: 'trophy',
    color: '#63C39F',
    sortOrder: 0,
  },
  {
    group: 'income',
    subGroup: 'irregular_income',
    name: '부업',
    icon: 'briefcase',
    color: '#63C39F',
    sortOrder: 1,
  },
  {
    group: 'income',
    subGroup: 'irregular_income',
    name: '중고거래',
    icon: 'arrows_clockwise',
    color: '#63C39F',
    sortOrder: 2,
  },

  // ── 지출: 고정 ──
  {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '월세',
    icon: 'house',
    color: '#D8635A',
    sortOrder: 0,
  },
  {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '금융비용',
    icon: 'bank',
    color: '#D8635A',
    sortOrder: 1,
  },
  {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '보험',
    icon: 'shield_check',
    color: '#D8635A',
    sortOrder: 2,
  },
  {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '공과금',
    icon: 'lightbulb',
    color: '#D8635A',
    sortOrder: 3,
  },
  {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '명절 용돈',
    icon: 'envelope',
    color: '#D8635A',
    sortOrder: 4,
  },
  // ── 지출: 변동 공통 ──
  {
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'bowl_food',
    color: '#D8635A',
    sortOrder: 0,
  },
  {
    group: 'expense',
    subGroup: 'variable_common',
    name: '소모품',
    icon: 'broom',
    color: '#D8635A',
    sortOrder: 1,
  },
  {
    group: 'expense',
    subGroup: 'variable_common',
    name: '패션',
    icon: 'tshirt',
    color: '#D8635A',
    sortOrder: 2,
  },
  {
    group: 'expense',
    subGroup: 'variable_common',
    name: '데이트',
    icon: 'heart',
    color: '#D8635A',
    sortOrder: 3,
  },
  {
    group: 'expense',
    subGroup: 'variable_common',
    name: '건강',
    icon: 'barbell',
    color: '#D8635A',
    sortOrder: 4,
  },
  // ── 지출: 변동 각자 ──
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '식비',
    icon: 'fork_knife',
    color: '#D8635A',
    sortOrder: 0,
  },
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '사회생활',
    icon: 'handshake',
    color: '#D8635A',
    sortOrder: 1,
  },
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '친구',
    icon: 'confetti',
    color: '#D8635A',
    sortOrder: 2,
  },
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '병원',
    icon: 'first_aid',
    color: '#D8635A',
    sortOrder: 3,
  },
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '교통',
    icon: 'bus',
    color: '#D8635A',
    sortOrder: 4,
  },
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '가족',
    icon: 'users_three',
    color: '#D8635A',
    sortOrder: 5,
  },
  {
    group: 'expense',
    subGroup: 'variable_personal',
    name: '자기계발',
    icon: 'book_open',
    color: '#D8635A',
    sortOrder: 6,
  },

  // ── 재테크: 현금 보유 ──
  {
    group: 'investment',
    subGroup: 'cash_holding',
    name: '예적금',
    icon: 'piggy_bank',
    color: '#5B8DEF',
    sortOrder: 0,
  },
  {
    group: 'investment',
    subGroup: 'cash_holding',
    name: '입출금',
    icon: 'credit_card',
    color: '#5B8DEF',
    sortOrder: 1,
  },
  // ── 재테크: 투자 ──
  {
    group: 'investment',
    subGroup: 'investment',
    name: '국내주식',
    icon: 'chart_line_up',
    color: '#5B8DEF',
    sortOrder: 0,
  },
  {
    group: 'investment',
    subGroup: 'investment',
    name: '해외주식',
    icon: 'globe',
    color: '#5B8DEF',
    sortOrder: 1,
  },
  {
    group: 'investment',
    subGroup: 'investment',
    name: '채권',
    icon: 'file_text',
    color: '#5B8DEF',
    sortOrder: 2,
  },

  // ── Flex: 공동 ──
  {
    group: 'flex',
    subGroup: 'joint_flex',
    name: '여행',
    icon: 'airplane',
    color: '#F0A05E',
    sortOrder: 0,
  },
  {
    group: 'flex',
    subGroup: 'joint_flex',
    name: '여가',
    icon: 'film_slate',
    color: '#F0A05E',
    sortOrder: 1,
  },
  // ── Flex: 각자 ──
  {
    group: 'flex',
    subGroup: 'personal_flex',
    name: '소비',
    icon: 'shopping_bag',
    color: '#F0A05E',
    sortOrder: 0,
  },
  {
    group: 'flex',
    subGroup: 'personal_flex',
    name: '여가',
    icon: 'game_controller',
    color: '#F0A05E',
    sortOrder: 1,
  },
];

export const COLOR_PRESETS = [
  '#E8837A', // coral-400 (primary)
  '#D8635A', // coral-500 (expense)
  '#4CAF86', // sage-400 (income)
  '#63C39F', // sage-300 (income-light)
  '#5B8DEF', // blue
  '#F0A05E', // orange
  '#9B7ED8', // purple
  '#E87CA0', // pink
  '#5BBDD8', // cyan
  '#8BC34A', // lime
  '#FF8A65', // deep orange
  '#78909C', // blue grey
];
