import type { Meta, StoryObj } from '@storybook/react';
import { Home, Mail } from 'lucide-react';
import { OnboardingChoiceCard } from './OnboardingChoiceCard';

const meta: Meta<typeof OnboardingChoiceCard> = {
  title: 'Onboarding/OnboardingChoiceCard',
  component: OnboardingChoiceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '온보딩 선택 화면의 선택 카드. "처음 시작해요"와 "초대 코드를 받았어요"를 같은 무게로 나란히 놓는다. ' +
          '접근성 이름(ariaLabel)은 행동("새 커플 공간 만들기")을, 화면 문구는 상황("처음 시작해요")을 말한다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OnboardingChoiceCard>;

/** 1. 처음 시작하는 사람 */
export const Create: Story = {
  name: '처음 시작해요',
  args: {
    icon: <Home size={22} />,
    title: '처음 시작해요',
    description: '새 공간을 만들고 짝꿍을 초대해요',
    ariaLabel: '새 커플 공간 만들기',
  },
};

/** 2. 초대받은 사람 */
export const Join: Story = {
  name: '초대 코드를 받았어요',
  args: {
    icon: <Mail size={22} />,
    title: '초대 코드를 받았어요',
    description: '짝꿍이 보낸 6자리 코드로 합류해요',
    ariaLabel: '초대 코드 입력하기',
  },
};

/** 3. 두 카드를 실제 화면처럼 나란히 */
export const Both: Story = {
  name: '선택 화면 (두 카드)',
  render: () => (
    <div className="flex flex-col gap-3">
      <OnboardingChoiceCard
        icon={<Home size={22} />}
        title="처음 시작해요"
        description="새 공간을 만들고 짝꿍을 초대해요"
        ariaLabel="새 커플 공간 만들기"
        onClick={() => {}}
      />
      <OnboardingChoiceCard
        icon={<Mail size={22} />}
        title="초대 코드를 받았어요"
        description="짝꿍이 보낸 6자리 코드로 합류해요"
        ariaLabel="초대 코드 입력하기"
        onClick={() => {}}
      />
    </div>
  ),
};

/** 4. 긴 설명 — 두 줄로 접힘 */
export const LongText: Story = {
  name: '긴 설명',
  args: {
    icon: <Mail size={22} />,
    title: '초대 코드를 받았어요',
    description:
      '짝꿍이 카카오톡이나 문자로 보내 준 여섯 자리 초대 코드를 입력하면 같은 가계부에 합류해요',
    ariaLabel: '초대 코드 입력하기',
  },
};
