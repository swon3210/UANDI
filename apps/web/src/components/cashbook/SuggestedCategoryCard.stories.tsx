import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SuggestedCategoryCard } from './SuggestedCategoryCard';
import type { SuggestedCategoryDraft } from './import-types';

const meta: Meta<typeof SuggestedCategoryCard> = {
  title: 'Cashbook/Import/SuggestedCategoryCard',
  component: SuggestedCategoryCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AI가 제안한 새 카테고리 한 장. 포함 체크·이름 수정·구분(고정/공통/각자 또는 정기/비정기) 선택. 체크를 풀면 흐려지고 잠긴다.',
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
type Story = StoryObj<typeof SuggestedCategoryCard>;

const pet: SuggestedCategoryDraft = {
  originalName: '반려동물',
  name: '반려동물',
  group: 'expense',
  subGroup: 'variable_common',
  icon: 'paw_print',
  entryCount: 7,
  included: true,
};

function Controlled({ initial, error }: { initial: SuggestedCategoryDraft; error?: string }) {
  const [draft, setDraft] = useState(initial);
  return <SuggestedCategoryCard draft={draft} onChange={setDraft} error={error} color="#E8837A" />;
}

export const Default: Story = {
  name: '지출 제안 (포함)',
  render: () => <Controlled initial={pet} />,
};

export const Excluded: Story = {
  name: '빼기 (체크 해제)',
  render: () => <Controlled initial={{ ...pet, included: false }} />,
};

export const Income: Story = {
  name: '수입 제안 (정기/비정기)',
  render: () => (
    <Controlled
      initial={{
        originalName: '임대수입',
        name: '임대수입',
        group: 'income',
        subGroup: 'regular_income',
        icon: 'house',
        entryCount: 1,
        included: true,
      }}
    />
  ),
};

export const EmptyNameError: Story = {
  name: '이름 비움 에러',
  render: () => <Controlled initial={{ ...pet, name: '' }} error="이름을 입력해 주세요" />,
};

export const DuplicateNameError: Story = {
  name: '중복 이름 에러',
  render: () => <Controlled initial={{ ...pet, name: '식비' }} error="이미 있는 카테고리예요" />,
};
