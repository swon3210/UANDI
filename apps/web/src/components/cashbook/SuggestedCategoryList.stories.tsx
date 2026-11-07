import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SuggestedCategoryList } from './SuggestedCategoryList';
import type { SuggestedCategoryDraft } from './import-types';

const meta: Meta<typeof SuggestedCategoryList> = {
  title: 'Cashbook/Import/SuggestedCategoryList',
  component: SuggestedCategoryList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '가져오기 2단계. AI가 새로 제안한 카테고리 카드 목록(수정·빼기 가능)과, 파싱 결과가 쓴 기본 카테고리 칩. 제안이 없으면 "기본 카테고리로 충분해요".',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[343px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SuggestedCategoryList>;

const drafts: SuggestedCategoryDraft[] = [
  {
    originalName: '반려동물',
    name: '반려동물',
    group: 'expense',
    subGroup: 'variable_common',
    icon: 'paw_print',
    entryCount: 7,
    included: true,
  },
  {
    originalName: '자동차',
    name: '자동차',
    group: 'expense',
    subGroup: 'fixed_expense',
    icon: 'bus',
    entryCount: 3,
    included: true,
  },
  {
    originalName: '임대수입',
    name: '임대수입',
    group: 'income',
    subGroup: 'regular_income',
    icon: 'house',
    entryCount: 1,
    included: false,
  },
];
const used = [
  { name: '식비', count: 12 },
  { name: '교통', count: 4 },
  { name: '공과금', count: 2 },
  { name: '정기급여', count: 1 },
];

function Controlled({
  initial,
  errors,
}: {
  initial: SuggestedCategoryDraft[];
  errors?: Record<number, string>;
}) {
  const [list, setList] = useState(initial);
  return (
    <SuggestedCategoryList
      drafts={list}
      usedCategories={used}
      errors={errors}
      onChange={(i, next) => setList((prev) => prev.map((d, j) => (j === i ? next : d)))}
    />
  );
}

export const Default: Story = {
  name: '제안 3개 + 쓰인 기본 4개',
  render: () => <Controlled initial={drafts} />,
};

export const NoSuggestions: Story = {
  name: '제안 없음 (기본으로 충분)',
  render: () => <Controlled initial={[]} />,
};

export const WithErrors: Story = {
  name: '이름 에러 포함',
  render: () => (
    <Controlled
      initial={[
        { ...drafts[0], name: '' },
        { ...drafts[1], name: '식비' },
      ]}
      errors={{ 0: '이름을 입력해 주세요', 1: '이미 있는 카테고리예요' }}
    />
  ),
};
