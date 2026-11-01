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
          '온보딩 투어 — "첫 행동 안내" 3장. 1) 둘이 함께 쓰는 가계부 2) 첫 내역 적기(+ 버튼 모형 + 입력 예시) 3) 예산·예측은 차차. ' +
          '스크린샷을 쓰지 않아 UI가 바뀌어도 어긋나지 않는다. 마지막 장은 "첫 내역 적기"(빠른 추가 시트)와 "둘러볼게요"로 끝난다. ' +
          '커플 연결 후 대시보드가 한 번 그려진 뒤 1회 자동 노출되고, 프로필 메뉴에서 다시 볼 수 있다.',
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
  args: {
    onClose: () => {},
    onFirstEntry: () => {},
    context: { partnerName: '세진' },
  },
};

export default meta;
type Story = StoryObj<typeof ServiceTourOverlay>;

export const Welcome: Story = {
  name: '1. 둘이 함께 쓰는 가계부예요',
  args: { defaultStep: 0 },
};

export const WelcomeWithoutPartnerName: Story = {
  name: '1. 짝꿍 이름 없음 (폴백)',
  args: { defaultStep: 0, context: { partnerName: null } },
};

export const FirstEntry: Story = {
  name: '2. 첫 내역을 적어 볼까요?',
  args: { defaultStep: 1 },
};

export const Later: Story = {
  name: '3. 예산과 예측은 차차 같이 (첫 내역 적기 / 둘러볼게요)',
  args: { defaultStep: 2 },
};
