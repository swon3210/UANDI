import type { Meta, StoryObj } from '@storybook/react';
import { Plus, ImagePlus, Pencil } from 'lucide-react';
import { Fab } from './Fab';
import type { Space } from './AppSidebar';

function Demo({
  space,
  icon,
  label,
  showLabel,
}: {
  space?: Space;
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}) {
  return (
    <div className="relative min-h-[420px] bg-background" data-space={space}>
      <div className="p-6">
        <p className="text-sm font-medium">페이지 콘텐츠 자리</p>
        <p className="text-sm text-muted-foreground">우하단 FAB를 확인하세요. 색은 공간 톤을 따릅니다.</p>
      </div>
      <Fab icon={icon} label={label} showLabel={showLabel} />
    </div>
  );
}

const meta: Meta<typeof Fab> = {
  title: 'Custom/Fab',
  component: Fab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '플로팅 액션 버튼(FAB). 화면의 주요 생성 액션(내역 추가/사진 업로드/글쓰기)에 사용한다. 우하단 고정, 색은 현재 공간 톤(coral/indigo/violet)을 자동으로 따른다. icon-only 기본형과 라벨을 함께 노출하는 확장형(showLabel)을 지원한다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Fab>;

export const AddEntry_Inner: Story = {
  name: '내역 추가 (우리집 · coral)',
  render: () => <Demo space="inner" icon={<Plus size={22} />} label="내역 추가" />,
};

export const Extended_Inner: Story = {
  name: '확장형 — 라벨 노출 (coral)',
  render: () => <Demo space="inner" icon={<Plus size={20} />} label="내역 추가" showLabel />,
};

export const UploadPhoto_Inner: Story = {
  name: '사진 업로드 (우리집 · coral)',
  render: () => <Demo space="inner" icon={<ImagePlus size={22} />} label="사진 업로드" />,
};

export const WritePost_Community: Story = {
  name: '글쓰기 (커뮤니티 · violet)',
  render: () => <Demo space="community" icon={<Pencil size={22} />} label="글쓰기" />,
};
