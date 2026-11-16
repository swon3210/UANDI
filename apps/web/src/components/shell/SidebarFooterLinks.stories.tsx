import type { Meta, StoryObj } from '@storybook/react';
import { BookOpen, Home, Image as ImageIcon } from 'lucide-react';
import { AppSidebar, type SidebarSection } from '@uandi/ui';
import { SidebarFooterLinks } from './SidebarFooterLinks';

/** 지금 노출되는 섹션(재테크·커뮤니티는 막아 둔 상태) */
const SECTIONS: SidebarSection[] = [
  {
    id: 'inner',
    label: '우리집',
    Icon: Home,
    items: [
      { id: 'cashbook', label: '가계부', href: '/inner/cashbook', Icon: BookOpen },
      { id: 'photos', label: '갤러리', href: '/inner/photos', Icon: ImageIcon },
    ],
  },
];

/** iOS 네이티브 — 섹션은 가계부 하나만, footer는 그대로 */
const IOS_SECTIONS: SidebarSection[] = [{ ...SECTIONS[0]!, items: [SECTIONS[0]!.items[0]!] }];

const meta: Meta<typeof SidebarFooterLinks> = {
  title: 'Shell/SidebarFooterLinks',
  component: SidebarFooterLinks,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SidebarFooterLinks>;

/** 링크 묶음만 */
export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-xs border-t border-border p-3">
        <Story />
      </div>
    ),
  ],
};

/** 사이드바에 넣은 모습 */
export const InSidebar: Story = {
  render: () => (
    <AppSidebar
      open
      onOpenChange={() => {}}
      sections={SECTIONS}
      activePath="/inner/cashbook"
      space="inner"
      footer={<SidebarFooterLinks />}
    />
  ),
};

/** iOS 네이티브 사이드바 — 섹션이 줄어도 footer의 공지사항은 보인다 */
export const InSidebarIos: Story = {
  render: () => (
    <AppSidebar
      open
      onOpenChange={() => {}}
      sections={IOS_SECTIONS}
      activePath="/inner/cashbook"
      space="inner"
      footer={<SidebarFooterLinks />}
    />
  ),
};
