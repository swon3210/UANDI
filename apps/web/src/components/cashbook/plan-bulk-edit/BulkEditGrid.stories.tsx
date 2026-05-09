import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import type {
  CashbookCategory,
  CategoryGroup,
  CategorySubGroup,
} from '@uandi/cashbook-core';
import { BulkEditGrid, type BulkEditRow } from './BulkEditGrid';

const meta: Meta<typeof BulkEditGrid> = {
  title: 'Cashbook/PlanBulkEdit/BulkEditGrid',
  component: BulkEditGrid,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="bg-stone-50 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BulkEditGrid>;

function category(
  id: string,
  name: string,
  group: CategoryGroup,
  subGroup: CategorySubGroup,
  color: string,
  icon: string
): CashbookCategory {
  return {
    id,
    coupleId: 'couple-1',
    group,
    subGroup,
    name,
    icon,
    color,
    isDefault: true,
    sortOrder: 0,
    createdAt: Timestamp.now(),
  };
}

const baseRows: BulkEditRow[] = [
  {
    itemId: 'item-salary',
    category: category(
      'cat-salary',
      '정기급여',
      'income',
      'regular_income',
      '#4CAF86',
      'wallet'
    ),
    monthlyAmounts: Array(12).fill(4_000_000),
    baseline: Array(12).fill(4_000_000),
  },
  {
    itemId: 'item-bonus',
    category: category(
      'cat-bonus',
      '상여',
      'income',
      'regular_income',
      '#4CAF86',
      'gift'
    ),
    monthlyAmounts: [
      0, 0, 3_000_000, 0, 0, 6_000_000, 0, 0, 3_000_000, 0, 0, 6_000_000,
    ],
    baseline: [
      0, 0, 3_000_000, 0, 0, 6_000_000, 0, 0, 3_000_000, 0, 0, 6_000_000,
    ],
  },
  {
    itemId: 'item-rent',
    category: category(
      'cat-rent',
      '월세',
      'expense',
      'fixed_expense',
      '#D8635A',
      'house'
    ),
    monthlyAmounts: Array(12).fill(900_000),
    baseline: Array(12).fill(900_000),
  },
  {
    itemId: 'item-food',
    category: category(
      'cat-food',
      '식비',
      'expense',
      'variable_common',
      '#E8837A',
      'bowl_food'
    ),
    monthlyAmounts: [
      600_000, 600_000, 600_000, 700_000, 600_000, 600_000, 600_000, 700_000,
      600_000, 600_000, 700_000, 800_000,
    ],
    baseline: [
      600_000, 600_000, 600_000, 700_000, 600_000, 600_000, 600_000, 700_000,
      600_000, 600_000, 700_000, 800_000,
    ],
  },
  {
    itemId: 'item-personal',
    category: category(
      'cat-personal',
      '취미',
      'flex',
      'personal_flex',
      '#9C7AE8',
      'sparkle'
    ),
    monthlyAmounts: Array(12).fill(150_000),
    baseline: Array(12).fill(150_000),
  },
];

function GridDemo({
  initialRows,
  prePopulateChanges,
}: {
  initialRows: BulkEditRow[];
  prePopulateChanges?: boolean;
}) {
  const [rows, setRows] = useState<BulkEditRow[]>(() => {
    if (!prePopulateChanges) return initialRows;
    return initialRows.map((row, i) => {
      if (i === 1) {
        const arr = row.monthlyAmounts.slice();
        arr[5] = 8_000_000;
        return { ...row, monthlyAmounts: arr };
      }
      if (i === 3) {
        const arr = row.monthlyAmounts.slice();
        arr[7] = 900_000;
        arr[11] = 1_000_000;
        return { ...row, monthlyAmounts: arr };
      }
      return row;
    });
  });

  return (
    <BulkEditGrid
      rows={rows}
      onChangeRow={(itemId, monthlyAmounts) => {
        setRows((prev) =>
          prev.map((row) => (row.itemId === itemId ? { ...row, monthlyAmounts } : row))
        );
      }}
      onResetRow={(itemId) => {
        setRows((prev) =>
          prev.map((row) =>
            row.itemId === itemId ? { ...row, monthlyAmounts: row.baseline.slice() } : row
          )
        );
      }}
    />
  );
}

export const Default: Story = {
  render: () => <GridDemo initialRows={baseRows} />,
};

export const WithChanges: Story = {
  render: () => <GridDemo initialRows={baseRows} prePopulateChanges />,
};

export const Empty: Story = {
  render: () => (
    <BulkEditGrid rows={[]} onChangeRow={() => {}} onResetRow={() => {}} />
  ),
};

export const ManyCategories: Story = {
  render: () => {
    const many: BulkEditRow[] = [
      ...baseRows,
      {
        itemId: 'item-utility',
        category: category(
          'cat-utility',
          '공과금',
          'expense',
          'fixed_expense',
          '#D8635A',
          'lightbulb'
        ),
        monthlyAmounts: [
          250_000, 240_000, 200_000, 180_000, 160_000, 150_000, 200_000,
          230_000, 200_000, 180_000, 200_000, 250_000,
        ],
        baseline: [
          250_000, 240_000, 200_000, 180_000, 160_000, 150_000, 200_000,
          230_000, 200_000, 180_000, 200_000, 250_000,
        ],
      },
      {
        itemId: 'item-insurance',
        category: category(
          'cat-insurance',
          '보험',
          'expense',
          'fixed_expense',
          '#D8635A',
          'shield_check'
        ),
        monthlyAmounts: Array(12).fill(180_000),
        baseline: Array(12).fill(180_000),
      },
      {
        itemId: 'item-joint-flex',
        category: category(
          'cat-joint-flex',
          '데이트',
          'flex',
          'joint_flex',
          '#9C7AE8',
          'heart'
        ),
        monthlyAmounts: Array(12).fill(300_000),
        baseline: Array(12).fill(300_000),
      },
    ];
    return <GridDemo initialRows={many} />;
  },
};
