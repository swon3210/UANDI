import type { Meta, StoryObj } from '@storybook/react';
import { Camera, BookOpen, Heart } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Custom/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '데이터가 없을 때 표시하는 빈 상태 컴포넌트. 아이콘, 제목, 설명, CTA 버튼을 지원합니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Photos: Story = {
  name: '사진 없음',
  args: {
    icon: <Camera size={40} />,
    title: '아직 사진이 없어요',
    description: '첫 번째 사진을 업로드해 보세요',
  },
};

export const PhotosWithAction: Story = {
  name: '사진 없음 + CTA',
  args: {
    icon: <Camera size={40} />,
    title: '아직 사진이 없어요',
    description: '첫 번째 사진을 업로드해 보세요',
    action: (
      <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
        첫 사진 올리기
      </button>
    ),
  },
};

export const Cashbook: Story = {
  name: '가계부 없음',
  args: {
    icon: <BookOpen size={40} />,
    title: '아직 내역이 없어요',
    description: '이번 달 첫 내역을 추가해 보세요',
    action: (
      <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
        추가하기
      </button>
    ),
  },
};

export const Dashboard: Story = {
  name: '대시보드 빈 상태',
  args: {
    icon: <Heart size={40} />,
    title: '아직 아무것도 없어요',
    description: '사진을 올리거나 가계부를 작성해보세요',
  },
};
