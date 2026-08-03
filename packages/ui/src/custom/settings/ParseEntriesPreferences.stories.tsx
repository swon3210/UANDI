import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ParseEntriesPreferences } from './ParseEntriesPreferences';
import { DEFAULT_PARSE_ENTRIES, type ParseEntriesPrefs } from './aiPreferences';

const CATEGORIES = ['식비', '교통', '외식', '카페', '쇼핑', '문화생활', '기타'];

const meta: Meta<typeof ParseEntriesPreferences> = {
  title: 'Settings/AI 맞춤화/C. 거래 파싱',
  component: ParseEntriesPreferences,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '영수증·거래내역 자동 분류 맞춤화 섹션. 가맹점·키워드 → 카테고리 매핑 규칙과 이체 키워드. ' +
          '자유 텍스트가 들어가는 유일한 섹션이라 category는 커플 카테고리 enum으로 제약하고, ' +
          'match/키워드는 개행 제거·길이 캡·개수 캡으로 방어한다(서버가 최종 재검증). ' +
          '파싱 결과는 기존 Zod 검증 + 사용자 확인 단계를 거치므로 blast radius 가 본인 커플로 한정된다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[380px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ParseEntriesPreferences>;

function Demo({ initial, categories }: { initial: ParseEntriesPrefs; categories: string[] }) {
  const [value, setValue] = useState(initial);
  return <ParseEntriesPreferences value={value} onChange={setValue} categories={categories} />;
}

export const Default: Story = {
  name: '기본 (꺼짐)',
  render: () => <Demo initial={DEFAULT_PARSE_ENTRIES} categories={CATEGORIES} />,
};

export const EnabledEmpty: Story = {
  name: '켜짐 (규칙 없음)',
  render: () => (
    <Demo initial={{ ...DEFAULT_PARSE_ENTRIES, enabled: true }} categories={CATEGORIES} />
  ),
};

export const WithRules: Story = {
  name: '규칙 + 이체 키워드',
  render: () => (
    <Demo
      initial={{
        enabled: true,
        categoryRules: [
          { match: '스타벅스', category: '카페' },
          { match: '지하철', category: '교통' },
        ],
        transferKeywords: ['홍길동', '토스'],
      }}
      categories={CATEGORIES}
    />
  ),
};

export const NoCategories: Story = {
  name: '카테고리 없음',
  render: () => <Demo initial={{ ...DEFAULT_PARSE_ENTRIES, enabled: true }} categories={[]} />,
};
