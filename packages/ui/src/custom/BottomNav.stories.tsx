import type { Meta, StoryObj } from '@storybook/react';
import {
  BookOpen,
  Image as ImageIcon,
  LayoutDashboard,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { BottomNav } from './BottomNav';

const meta: Meta<typeof BottomNav> = {
  title: 'Custom/BottomNav',
  component: BottomNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'AppShell 하단의 공간별 네비게이션. 우리집은 3탭, 재테크는 4탭. `data-space="outer"` 컨텍스트에서는 활성 탭 색이 자동으로 indigo로 전환됩니다 (`text-primary`가 시맨틱 토큰 따름).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

const INNER_ITEMS = [
  { id: 'home', label: '홈', href: '/inner', Icon: LayoutDashboard },
  { id: 'photos', label: '사진', href: '/inner/photos', Icon: ImageIcon },
  { id: 'cashbook', label: '가계부', href: '/inner/cashbook', Icon: BookOpen },
];

const OUTER_ITEMS = [
  { id: 'home', label: '홈', href: '/outer', Icon: LayoutDashboard },
  { id: 'forex', label: '환테크', href: '/outer/forex', Icon: Wallet },
  { id: 'investment', label: '투자', href: '/outer/investment', Icon: TrendingUp },
  { id: 'savings', label: '적금', href: '/outer/savings', Icon: PiggyBank },
];

const PreviewFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-[200px] bg-background">
    <div className="p-6 text-sm text-muted-foreground">
      페이지 콘텐츠 자리. 하단 고정 BottomNav를 확인하세요.
    </div>
    {children}
  </div>
);

export const InnerHome: Story = {
  name: '우리집 — 홈 활성',
  render: (args) => (
    <PreviewFrame>
      <BottomNav {...args} />
    </PreviewFrame>
  ),
  args: { items: INNER_ITEMS, activeId: 'home' },
};

export const InnerCashbook: Story = {
  name: '우리집 — 가계부 활성',
  render: (args) => (
    <PreviewFrame>
      <BottomNav {...args} />
    </PreviewFrame>
  ),
  args: { items: INNER_ITEMS, activeId: 'cashbook' },
};

export const OuterHome: Story = {
  name: '재테크 — 홈 활성 (indigo)',
  render: (args) => (
    <div data-space="outer">
      <PreviewFrame>
        <BottomNav {...args} />
      </PreviewFrame>
    </div>
  ),
  args: { items: OUTER_ITEMS, activeId: 'home' },
};

export const OuterForex: Story = {
  name: '재테크 — 환테크 활성 (indigo)',
  render: (args) => (
    <div data-space="outer">
      <PreviewFrame>
        <BottomNav {...args} />
      </PreviewFrame>
    </div>
  ),
  args: { items: OUTER_ITEMS, activeId: 'forex' },
};

export const OuterSavings: Story = {
  name: '재테크 — 적금 활성 (indigo)',
  render: (args) => (
    <div data-space="outer">
      <PreviewFrame>
        <BottomNav {...args} />
      </PreviewFrame>
    </div>
  ),
  args: { items: OUTER_ITEMS, activeId: 'savings' },
};
