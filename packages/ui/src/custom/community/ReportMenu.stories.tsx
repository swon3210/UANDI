import type { Meta, StoryObj } from '@storybook/react';
import { ReportMenu } from './ReportMenu';

const meta: Meta<typeof ReportMenu> = {
  title: 'Community/ReportMenu',
  component: ReportMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '카드 [⋯] 액션 메뉴. 콜백(onDelete/onReport)이 전달된 항목만 렌더된다. Phase 3은 본인 글 삭제만, Phase 4에서 신고하기 추가.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReportMenu>;

export const OwnerDeleteOnly: Story = {
  name: '본인 글 (삭제만)',
  args: {
    onDelete: () => alert('삭제'),
  },
};

export const OtherReportOnly: Story = {
  name: '타인 글 (신고만 — Phase 4 미리보기)',
  args: {
    onReport: () => alert('신고'),
  },
};
