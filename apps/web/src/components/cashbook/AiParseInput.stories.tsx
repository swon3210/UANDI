import type { Meta, StoryObj } from '@storybook/react';
import { AiParseInput } from './AiParseInput';

const mockCategories = ['식비', '교통', '쇼핑', '의료', '문화/여가', '주거/관리비'];

const today = new Date().toISOString().split('T')[0];

const mockParseFnSingle = async (text: string, _categories: string[], images?: string[]) => {
  await new Promise((r) => setTimeout(r, 800));
  const imagesCount = images?.length ?? 0;
  const base = [
    {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: text.replace(/\d+.*$/, '').trim() || '김치찌개',
      date: today,
      confidence: 0.95,
    },
  ];
  const fromImages = Array.from({ length: imagesCount }, (_, i) => ({
    type: 'expense',
    amount: 12000 + i * 1000,
    category: '식비',
    description: `영수증 ${i + 1}`,
    date: today,
    confidence: 0.82,
  }));
  return [...base.slice(0, text.trim() ? 1 : 0), ...fromImages].slice(0, 10);
};

const mockParseFnMulti = async (text: string) => {
  await new Promise((r) => setTimeout(r, 800));
  const lines = text.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  return lines.map((line, i) => ({
    type: i === lines.length - 1 ? 'income' : 'expense',
    amount: (i + 1) * 5000,
    category: i === lines.length - 1 ? '정기급여' : '식비',
    description: line,
    date: today,
    confidence: 0.9,
  }));
};

const mockParseFnError = async () => {
  await new Promise((r) => setTimeout(r, 300));
  throw new Error('일일 사용 한도를 초과했습니다');
};

const mockParseFnSlow = async () => {
  await new Promise((r) => setTimeout(r, 60_000));
  return [];
};

const meta: Meta<typeof AiParseInput> = {
  title: 'Cashbook/AiParseInput',
  component: AiParseInput,
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiParseInput>;

export const Default: Story = {
  args: {
    categories: mockCategories,
    parseFn: mockParseFnSingle,
    onParsed: (results) => console.log('Parsed:', results),
  },
};

export const Multi: Story = {
  args: {
    categories: mockCategories,
    parseFn: mockParseFnMulti,
    onParsed: (results) => console.log('Parsed multi:', results),
  },
};

export const Error: Story = {
  args: {
    categories: mockCategories,
    parseFn: mockParseFnError,
    onParsed: (results) => console.log('Parsed:', results),
  },
};

export const WithImageAttach: Story = {
  name: 'With Image Attach (영수증 첨부 가능)',
  args: {
    categories: mockCategories,
    parseFn: mockParseFnSingle,
    onParsed: (results) => console.log('Parsed:', results),
  },
  parameters: {
    docs: {
      description: {
        story:
          '클립 버튼을 눌러 영수증 이미지를 최대 10장까지 첨부할 수 있다. 텍스트 없이 이미지만으로도 제출 가능.',
      },
    },
  },
};

export const SubmittingLoading: Story = {
  name: 'Submitting (Loading)',
  args: {
    categories: mockCategories,
    parseFn: mockParseFnSlow,
    onParsed: (results) => console.log('Parsed:', results),
  },
  parameters: {
    docs: {
      description: {
        story:
          '제출 중 상태. Submit 버튼에 스피너가 뜨고 textarea는 비활성화된다.',
      },
    },
  },
};
