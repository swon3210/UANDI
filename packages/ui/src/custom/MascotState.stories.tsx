import type { Meta, StoryObj } from '@storybook/react';
import { MascotState } from './MascotState';
import { Button } from '../components/button';
import mascotEmpty from '../assets/mascot-empty.png';
import mascotError from '../assets/mascot-error.png';
import mascotSuccess from '../assets/mascot-success.png';
import mascotIdle from '../assets/mascot-idle.png';

const meta: Meta<typeof MascotState> = {
  title: 'Custom/MascotState',
  component: MascotState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '마스코트 일러스트 + 메시지로 구성하는 상태 화면. 빈 화면/에러/성공/유휴 등 "로딩이 아닌" 상태에 사용한다. ' +
          '마스코트 에셋은 `@uandi/ui` 패키지(`src/assets/mascot-*.png`)에서 import 한다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MascotState>;

export const Empty: Story = {
  name: '빈 화면',
  args: {
    src: mascotEmpty,
    title: '아직 내역이 없어요',
    description: '첫 가계부 내역을 추가해 보세요',
    action: <Button>내역 추가</Button>,
  },
};

export const ErrorState: Story = {
  name: '에러',
  args: {
    src: mascotError,
    title: '문제가 생겼어요',
    description: '잠시 후 다시 시도해 주세요',
    action: <Button variant="outline">다시 시도</Button>,
  },
};

export const Success: Story = {
  name: '성공',
  args: {
    src: mascotSuccess,
    title: '완료됐어요!',
    description: '이번 달 가계부 점검을 마쳤어요',
  },
};

export const Idle: Story = {
  name: '유휴/대기',
  args: {
    src: mascotIdle,
    title: '오늘은 조용하네요',
    description: '새로운 소식이 오면 알려드릴게요',
  },
};
