import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { Sheet } from '@uandi/ui';
import { CategoryForm } from './CategoryForm';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof CategoryForm> = {
  title: 'Cashbook/CategoryForm',
  component: CategoryForm,
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CategoryForm>;

const ts = Timestamp.now();

const sikbiParent: CashbookCategory = {
  id: 'p-sikbi',
  coupleId: 'c1',
  group: 'expense',
  subGroup: 'variable_common',
  name: '식비',
  icon: 'bowl_food',
  color: '#D8635A',
  isDefault: true,
  sortOrder: 0,
  parentCategoryId: null,
  description: '부부가 함께한 장보기·외식·배달',
  examples: ['장보기', '외식', '배달'],
  createdAt: ts,
};

const noop = async () => {};

export const AddIncome: Story = {
  args: {
    group: 'income',
    onSubmit: noop,
    onClose: () => {},
  },
};

export const AddExpense: Story = {
  args: {
    group: 'expense',
    onSubmit: noop,
    onClose: () => {},
  },
};

export const AddChildCategory: Story = {
  args: {
    group: 'expense',
    parentCategory: sikbiParent,
    onSubmit: noop,
    onClose: () => {},
  },
};

export const EditCategory: Story = {
  args: {
    group: 'income',
    editingCategory: {
      id: '1',
      coupleId: 'c1',
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      color: '#4CAF86',
      isDefault: true,
      sortOrder: 0,
      parentCategoryId: null,
      description: '매달 고정으로 들어오는 급여',
      examples: ['월급'],
      createdAt: ts,
    },
    onSubmit: noop,
    onClose: () => {},
  },
};

// 정기 발생 제안('move')에서 열리는 모드: 구분이 고정 지출로 잠기고 감지값(발생일·금액)이 prefill된다.
// 같은 group의 기존 이름은 저장 시 거부된다('구독' 입력 후 저장 → 에러).
export const AddFixedFromSuggestion: Story = {
  args: {
    group: 'expense',
    lockedSubGroup: 'fixed_expense',
    title: '고정 지출 카테고리 만들기',
    takenNames: ['구독', '식비', '월세'],
    initialValues: {
      description: "'구독'에서 매월 15일쯤 반복되던 항목",
      recurrence: {
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: 15,
        expectedAmount: 15000,
      },
    },
    onSubmit: noop,
    onClose: () => {},
  },
};
