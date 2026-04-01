import type { Meta, StoryObj } from '@storybook/react';
import { AiParseInput } from './AiParseInput';

const mockCategories = ['식비', '교통', '쇼핑', '의료', '문화/여가', '주거/관리비'];

const mockParseFn = async (text: string, _categories: string[]) => {
  await new Promise((r) => setTimeout(r, 800));
  return {
    type: 'expense',
    amount: 9000,
    category: '식비',
    description: text.replace(/\d+.*$/, '').trim(),
    date: new Date().toISOString().split('T')[0],
    confidence: 0.95,
  };
};

const mockParseFnLowConfidence = async () => {
  await new Promise((r) => setTimeout(r, 500));
  return {
    type: 'expense',
    amount: 15000,
    category: '기타',
    description: '알 수 없음',
    date: new Date().toISOString().split('T')[0],
    confidence: 0.4,
  };
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
    parseFn: mockParseFn,
    onParsed: (result) => console.log('Parsed:', result),
  },
};

export const LowConfidence: Story = {
  args: {
    categories: mockCategories,
    parseFn: mockParseFnLowConfidence,
    onParsed: (result) => console.log('Low confidence:', result),
  },
};

export const Error: Story = {
  args: {
    categories: mockCategories,
    parseFn: mockParseFnError,
    onParsed: (result) => console.log('Parsed:', result),
  },
};
