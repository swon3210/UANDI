import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { OverlayProvider } from 'overlay-kit';
import { Sheet } from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import { createDefaultFilterState } from '@/hooks/useCashbook';
import { CashbookFilterSheet } from './CashbookFilterSheet';
import type { FilterMember } from './CreatorFilterChips';

const ts = Timestamp.now();
const base: Omit<CashbookCategory, 'id' | 'name' | 'icon' | 'color' | 'group' | 'subGroup'> = {
  coupleId: 'couple-1',
  isDefault: true,
  sortOrder: 0,
  parentCategoryId: null,
  description: '',
  examples: [],
  createdAt: ts,
};

const categories: CashbookCategory[] = [
  { ...base, id: '1', group: 'expense', subGroup: 'variable_common', name: '식비', icon: 'bowl_food', color: '#D8635A', sortOrder: 0 },
  { ...base, id: '2', group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus', color: '#5AA1D8', sortOrder: 1 },
  { ...base, id: '3', group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house', color: '#A05ED8', sortOrder: 2 },
  { ...base, id: '4', group: 'expense', subGroup: 'fixed_expense', name: '보험', icon: 'shield_check', color: '#5ED8A0', sortOrder: 3 },
  { ...base, id: '5', group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', color: '#5AA1D8', sortOrder: 0 },
  { ...base, id: '6', group: 'flex', subGroup: 'joint_flex', name: '여행', icon: 'airplane', color: '#F0A05E', sortOrder: 0 },
];

const members: FilterMember[] = [
  { uid: 'u1', displayName: '지은', photoURL: 'https://i.pravatar.cc/80?img=5' },
  { uid: 'u2', displayName: '민준', photoURL: null },
];

const meta: Meta<typeof CashbookFilterSheet> = {
  title: 'Cashbook/CashbookFilterSheet',
  component: CashbookFilterSheet,
  decorators: [
    (Story) => (
      <OverlayProvider>
        <Sheet open>
          <Story />
        </Sheet>
      </OverlayProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CashbookFilterSheet>;

const commonArgs = {
  categories,
  members,
  initial: createDefaultFilterState(),
  onApply: (next: unknown) => console.log('apply', next),
  onClose: () => console.log('close'),
};

export const Default: Story = {
  args: { ...commonArgs },
};

export const WithActiveFilters: Story = {
  args: {
    ...commonArgs,
    initial: {
      period: { mode: 'month', year: 2024, month: 0 },
      selectedTypes: ['expense', 'income'],
      selectedCategoryNames: ['식비', '교통'],
      selectedCreatorUids: ['u1'],
      keyword: '마트',
      sort: 'latest',
    },
  },
};

export const CustomRange: Story = {
  args: {
    ...commonArgs,
    initial: {
      period: { mode: 'custom', start: '2024-01-01', end: '2024-03-15' },
      selectedTypes: [],
      selectedCategoryNames: [],
      selectedCreatorUids: [],
      keyword: '',
      sort: 'latest',
    },
  },
};

/** 커플이 아직 1명뿐이면 '추가한 사람' 섹션은 숨겨진다. */
export const SoloCouple: Story = {
  args: {
    ...commonArgs,
    members: [{ uid: 'u1', displayName: '지은', photoURL: null }],
  },
};

export const NoCategories: Story = {
  args: {
    ...commonArgs,
    categories: [],
  },
};
