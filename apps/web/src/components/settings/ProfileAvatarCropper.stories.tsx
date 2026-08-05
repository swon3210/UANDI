import type { Meta, StoryObj } from '@storybook/react';
import { ProfileAvatarCropper } from './ProfileAvatarCropper';

const meta: Meta<typeof ProfileAvatarCropper> = {
  title: 'Settings/프로필/사진 크롭',
  component: ProfileAvatarCropper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '프로필 사진 크롭 다이얼로그. 1:1 정사각으로 잘라 아바타가 찌그러지지 않게 한다. ' +
          '드래그로 위치, 슬라이더/휠로 확대를 조절하고 "적용"을 누르면 잘린 파일을 올린다. ' +
          '(원격 이미지는 CORS로 인해 스토리에서 "적용" 시 변환이 막힐 수 있음 — 실제 앱은 ' +
          '로컬 파일의 object URL을 쓰므로 문제없음)',
      },
    },
  },
  args: {
    isOpen: true,
    onCancel: () => {},
    onCropped: (file) => console.log('cropped', file),
  },
};

export default meta;
type Story = StoryObj<typeof ProfileAvatarCropper>;

export const Landscape: Story = {
  name: '가로 이미지 (1:1로 크롭)',
  args: { imageSrc: 'https://picsum.photos/id/1025/800/500' },
};

export const Portrait: Story = {
  name: '세로 이미지 (1:1로 크롭)',
  args: { imageSrc: 'https://picsum.photos/id/1062/500/800' },
};
