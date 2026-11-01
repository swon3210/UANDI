import type { Meta, StoryObj } from '@storybook/react';
import { ImportStepIndicator } from './ImportStepIndicator';

const meta: Meta<typeof ImportStepIndicator> = {
  title: 'Cashbook/Import/ImportStepIndicator',
  component: ImportStepIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '가져오기 3단계(올리기 → 카테고리 → 내역 확인) 표시. 현재 단계만 라벨을 붙인다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImportStepIndicator>;

export const Step1: Story = { name: '1단계 올리기', args: { current: 1 } };
export const Step2: Story = { name: '2단계 카테고리', args: { current: 2 } };
export const Step3: Story = { name: '3단계 내역 확인', args: { current: 3 } };
