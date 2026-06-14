import type { Meta, StoryObj } from '@storybook/react';
import { BookOpen, Image as ImageIcon, TrendingUp, Users } from 'lucide-react';
import { AppNav, type AppNavItem, type AppNavLinkProps } from './AppNav';
import type { Space } from './AppSidebar';

const ITEMS: AppNavItem[] = [
  { id: 'cashbook', label: '가계부', href: '/inner/cashbook', Icon: BookOpen },
  { id: 'photos', label: '갤러리', href: '/inner/photos', Icon: ImageIcon },
  { id: 'outer', label: '재테크', href: '/outer', Icon: TrendingUp },
  { id: 'community', label: '커뮤니티', href: '/community', Icon: Users },
];

// 스토리에서 실제 페이지 이동을 막기 위한 링크 컴포넌트
const StoryLink = ({ href: _href, onClick, ...props }: AppNavLinkProps) => (
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
  return (
    <div className="relative min-h-[560px] bg-background" data-space={space}>
      <div className="space-y-2 p-6 pb-28">
        <p className="text-sm font-medium">페이지 콘텐츠 자리</p>
        <p className="text-sm text-muted-foreground">
          하단 고정 탭바를 확인하세요. 활성 탭은 현재 공간 톤을 따릅니다.
        </p>
      </div>
      <AppNav items={ITEMS} activePath={activePath} LinkComponent={StoryLink} />
    </div>
  );
}

const meta: Meta<typeof AppNav> = {
  title: 'Custom/AppNav',
  component: AppNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '전역 하단탭 네비게이션. 일상 목적지(홈/가계부/갤러리/재테크/커뮤니티) 5개를 상시 노출해 BottomNav와 SpaceSwitcher, 사이드바를 모두 대체합니다. 활성 탭은 가장 긴 prefix 매칭으로 결정되고, 현재 공간 톤(coral/indigo/violet)을 자동으로 따릅니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppNav>;

export const Cashbook_Inner: Story = {
  name: '가계부 루트=대시보드 활성 (우리집 · coral)',
  render: () => <Demo activePath="/inner/cashbook" space="inner" />,
};

export const CashbookDeep_PrefixMatch: Story = {
  name: '가계부 하위 경로에서도 가계부 활성 (prefix 매칭)',
  render: () => <Demo activePath="/inner/cashbook/review" space="inner" />,
};

export const Photos_Inner: Story = {
  name: '갤러리 활성 (우리집 · coral)',
  render: () => <Demo activePath="/inner/photos" space="inner" />,
};

export const Outer_Indigo: Story = {
  name: '재테크 활성 (indigo)',
  render: () => <Demo activePath="/outer" space="outer" />,
};

export const Community_Violet: Story = {
  name: '커뮤니티 활성 (violet)',
  render: () => <Demo activePath="/community" space="community" />,
};
