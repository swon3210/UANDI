import type { Meta, StoryObj } from '@storybook/react';
import { MascotLoader } from './MascotLoader';
import mascotSrc from '../assets/mascot-loading.png';
import mascotSageSrc from '../assets/mascot-loading-green.png';

const meta: Meta<typeof MascotLoader> = {
  title: 'Custom/MascotLoader',
  component: MascotLoader,
  tags: ['autodocs'],
  args: {
    src: mascotSrc,
  },
  parameters: {
    docs: {
      description: {
        component:
          '정적 마스코트 + 바운싱 점 3개 로딩 인디케이터. 마스코트 이미지는 움직이지 않고 아래 점이 움직인다. ' +
          '점 애니메이션은 `prefers-reduced-motion: reduce` 사용자에겐 자동으로 정지된다. ' +
          '`fullScreen` 으로 `FullScreenSpinner` 를 1:1 대체할 수 있다. ' +
          '마스코트 에셋은 `@uandi/ui` 패키지(`src/assets/mascot-loading.png`)에서 import 한다 — ' +
          'web에서는 Next가 content-hash + immutable 캐싱하고, 파일 변경 시 해시도 바뀌어 캐시가 자동 무효화된다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MascotLoader>;

export const Default: Story = {
  name: '기본 (인라인)',
};

export const WithCaption: Story = {
  name: '캡션 포함',
  args: {
    caption: '불러오는 중이에요',
  },
};

export const FullScreen: Story = {
  name: '전체 화면 (FullScreenSpinner 대체)',
  args: {
    fullScreen: true,
    caption: '잠시만 기다려 주세요',
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const Partner: Story = {
  name: '짝꿍 (세이지/그린 스카프)',
  args: {
    src: mascotSageSrc,
    caption: '불러오는 중이에요',
  },
};
