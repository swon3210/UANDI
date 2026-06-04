import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { CategoryChildChip } from './CategoryChildChip';
import type { CashbookCategory } from '@/types';

const meta: Meta<typeof CategoryChildChip> = {
  title: 'Cashbook/CategoryChildChip',
  component: CategoryChildChip,
};

export default meta;
type Story = StoryObj<typeof CategoryChildChip>;

const ts = Timestamp.now();

const base: Omit<CashbookCategory, 'name' | 'subGroup' | 'icon' | 'color'> = {
  id: 'c1',
  coupleId: 'couple-1',
  group: 'expense',
  isDefault: false,
  sortOrder: 0,
  parentCategoryId: 'p1',
  description: '',
  examples: [],
  createdAt: ts,
};

export const Common: Story = {
  args: {
    category: {
      ...base,
      subGroup: 'variable_common',
      name: '외식',
      icon: 'fork_knife',
      color: '#D8635A',
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Personal: Story = {
  args: {
    category: {
      ...base,
      subGroup: 'variable_personal',
      name: '점심',
      icon: 'bowl_food',
      color: '#D8635A',
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Fixed: Story = {
  args: {
    category: {
      ...base,
      subGroup: 'fixed_expense',
      name: '월세',
      icon: 'house',
      color: '#D8635A',
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const FlexJoint: Story = {
  args: {
    category: {
      ...base,
      group: 'flex',
      subGroup: 'joint_flex',
      name: '여행',
      icon: 'airplane',
      color: '#F0A05E',
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};

// 고정 지출의 자식: 정기 발생 배지("매월 N일")가 chip에 표시됨
export const FixedWithRecurrence: Story = {
  args: {
    category: {
      ...base,
      subGroup: 'fixed_expense',
      name: '주차비',
      icon: 'car',
      color: '#D8635A',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: 5 },
    },
    onEdit: () => {},
    onDelete: () => {},
  },
};
