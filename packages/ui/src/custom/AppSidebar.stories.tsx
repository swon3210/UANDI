import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button } from '../components/button';
import { AppSidebar, type SidebarLinkProps, type SidebarSection, type Space } from './AppSidebar';

const SECTIONS: SidebarSection[] = [
  {
    id: 'inner',
    label: '우리집',
    Icon: Home,
    items: [
      { id: 'inner-home', label: '홈', href: '/inner', Icon: LayoutDashboard },
      { id: 'photos', label: '사진', href: '/inner/photos', Icon: ImageIcon },
      {
        id: 'cashbook',
        label: '가계부',
        href: '/inner/cashbook/history',
        match: '/inner/cashbook',
        Icon: BookOpen,
      },
    ],
  },
  {
    id: 'outer',
    label: '재테크',
    Icon: Briefcase,
    items: [
      { id: 'outer-home', label: '홈', href: '/outer', Icon: LayoutDashboard },
      { id: 'forex', label: '환테크', href: '/outer/forex', Icon: Wallet },
      { id: 'investment', label: '투자', href: '/outer/investment', Icon: TrendingUp },
      { id: 'savings', label: '적금', href: '/outer/savings', Icon: PiggyBank },
    ],
  },
];

// 스토리에서 실제 페이지 이동을 막기 위한 링크 컴포넌트
const StoryLink = ({ href: _href, onClick, ...props }: SidebarLinkProps) => (
  <a
    {...props}
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick?.(e);
    }}
  />
);

function Demo({ activePath, space }: { activePath: string; space?: Space }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-[520px] bg-background p-6" data-space={space}>
      <p className="mb-4 text-sm text-muted-foreground">
        페이지 콘텐츠 자리. 좌측 사이드바를 확인하세요.
      </p>
      <Button variant="outline" onClick={() => setOpen(true)}>
        메뉴 열기
      </Button>
      <AppSidebar
        open={open}
        onOpenChange={setOpen}
        sections={SECTIONS}
        activePath={activePath}
        space={space}
        LinkComponent={StoryLink}
        onNavigate={() => setOpen(false)}
      />
    </div>
  );
}

const meta: Meta<typeof AppSidebar> = {
  title: 'Custom/AppSidebar',
  component: AppSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '헤더의 메뉴 버튼으로 여는 좌측 사이드바. 우리집/재테크 두 공간의 페이지를 한 목록에 모아 BottomNav와 SpaceSwitcher를 모두 대체합니다. 활성 항목은 현재 공간 톤(coral/indigo)을 따릅니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

export const InnerHome: Story = {
  name: '우리집 — 홈 활성',
  render: () => <Demo activePath="/inner" space="inner" />,
};

export const InnerCashbook: Story = {
  name: '우리집 — 가계부 활성',
  render: () => <Demo activePath="/inner/cashbook/history" space="inner" />,
};

export const InnerPhotosDetail: Story = {
  name: '우리집 — 사진 하위 경로 활성',
  render: () => <Demo activePath="/inner/photos/folder/abc123" space="inner" />,
};

export const OuterForex: Story = {
  name: '재테크 — 환테크 활성 (indigo)',
  render: () => <Demo activePath="/outer/forex" space="outer" />,
};

export const OuterSavings: Story = {
  name: '재테크 — 적금 활성 (indigo)',
  render: () => <Demo activePath="/outer/savings" space="outer" />,
};
