import type { Meta, StoryObj } from '@storybook/react';
import { InviteCodePanel } from './InviteCodePanel';

const meta: Meta<typeof InviteCodePanel> = {
  title: 'Onboarding/InviteCodePanel',
  component: InviteCodePanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '초대 코드 패널 — 코드 표시 + 코드 복사 + 링크 공유, 그리고 온보딩에서만 "먼저 시작하기". ' +
          '온보딩 코드 화면과 대시보드 초대 시트가 공유한다. 클립보드·공유 API·라우팅은 소비 측 책임.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] px-4">
        <Story />
      </div>
    ),
  ],
  args: {
    code: 'AB12CD',
    onCopy: () => {},
    onShare: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof InviteCodePanel>;

/** 1. 온보딩 코드 화면 — 먼저 시작하기 포함 */
export const Onboarding: Story = {
  name: '온보딩 (먼저 시작하기 포함)',
  args: { onStart: () => {} },
};

/** 2. 대시보드 초대 시트 — 먼저 시작하기 없음 */
export const DashboardSheet: Story = {
  name: '대시보드 시트 (시작 버튼 없음)',
};

/** 3. 복사 직후 피드백 */
export const Copied: Story = {
  name: '복사됨 피드백',
  args: { copied: true, onStart: () => {} },
};

/** 4. 문구 커스텀 — 재발급 안내 */
export const CustomLabels: Story = {
  name: '문구 커스텀',
  args: {
    code: 'ZZ99QX',
    expiresLabel: '새로 발급한 코드예요. 48시간 동안 유효해요',
    waitingLabel: '짝꿍이 들어오면 홈 화면이 바로 바뀌어요',
  },
};
