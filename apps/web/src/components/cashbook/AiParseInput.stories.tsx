import type { Meta, StoryObj } from '@storybook/react';
import { AiParseInput } from './AiParseInput';

const mockCategories = ['식비', '교통', '쇼핑', '의료', '문화/여가', '주거/관리비'];

const today = new Date().toISOString().split('T')[0];

const mockParseFnSingle = async (text: string) => {
  await new Promise((r) => setTimeout(r, 800));
  return [
    {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: text.replace(/\d+.*$/, '').trim() || '김치찌개',
      date: today,
      confidence: 0.95,
    },
  ];
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
