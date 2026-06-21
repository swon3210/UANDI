import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '@uandi/ui';
import { ServiceTourOverlay } from './ServiceTourOverlay';

const meta: Meta<typeof ServiceTourOverlay> = {
  title: 'Onboarding/ServiceTourOverlay',
  component: ServiceTourOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'MOA 온보딩 투어. 1장에서 가계부 상단 탭(대시보드·내역·현금흐름·목표)을 안내하고, 가계부 핵심 기능(내역·목표·현금흐름·점검)을 기능별로 풍부하게 보여준 뒤, 갤러리·재테크·커뮤니티는 "그 외 기능" 한 장으로 묶는다. 모바일은 전체 화면, 데스크톱은 가운데 카드. 로그인 후 대시보드 첫 진입 시 1회 자동 노출되고, 프로필 메뉴에서 다시 볼 수 있다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Dialog open>
        <Story />
      </Dialog>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ServiceTourOverlay>;

export const Welcome: Story = {
  name: '1. 가계부 소개 + 상단 탭 안내',
  args: { defaultStep: 0, onClose: () => {} },
};

export const CashbookRecord: Story = {
  name: '2. 가계부 — 내역 기록 + 요약',
  args: { defaultStep: 1, onClose: () => {} },
};

export const CashbookBudget: Story = {
  name: '3. 가계부 — 목표 세우기',
  args: { defaultStep: 2, onClose: () => {} },
};

export const CashbookCashflow: Story = {
  name: '4. 가계부 — 현금흐름 예측',
  args: { defaultStep: 3, onClose: () => {} },
};

export const CashbookSettlement: Story = {
  name: '5. 가계부 — 점검하기',
  args: { defaultStep: 4, onClose: () => {} },
};

export const MoreFeatures: Story = {
  name: '6. 그 외 기능 — 베타',
  args: { defaultStep: 5, onClose: () => {} },
};

export const Ready: Story = {
  name: '7. 마무리 — 성공 마스코트 (시작하기)',
  args: { defaultStep: 6, onClose: () => {} },
};
