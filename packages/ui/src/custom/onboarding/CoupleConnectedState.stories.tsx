import type { Meta, StoryObj } from '@storybook/react';
import { CoupleConnectedState } from './CoupleConnectedState';
import coralMascot from '../../assets/mascot-couple-coral.png';
import sageMascot from '../../assets/mascot-couple-sage.png';

const meta: Meta<typeof CoupleConnectedState> = {
  title: 'Onboarding/CoupleConnectedState',
  component: CoupleConnectedState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '커플 연결 완료 화면. 두 마스코트(나=코랄, 짝꿍=세이지)와 "OO님과 연결됐어요!" 한 장으로 연결의 순간을 만든 뒤 시작하기로 대시보드에 들어간다. ' +
          '공간을 만든 사람과 합류한 사람 모두 거친다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] py-8">
        <Story />
      </div>
    ),
  ],
  args: {
    myMascotSrc: coralMascot,
    partnerMascotSrc: sageMascot,
    onStart: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof CoupleConnectedState>;

export const Default: Story = { name: '기본', args: { partnerName: '진성' } };

export const FallbackName: Story = {
  name: '상대 이름을 못 읽음 (폴백)',
  args: { partnerName: '짝꿍' },
};

export const LongName: Story = {
  name: '긴 이름',
  args: { partnerName: '김진성 (우리집 살림 담당)' },
};

export const Starting: Story = {
  name: '시작 중 (버튼 비활성)',
  args: { partnerName: '진성', isStarting: true },
};
