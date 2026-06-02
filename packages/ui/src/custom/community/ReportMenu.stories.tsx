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
          '카드 [⋯] 액션 메뉴. 콜백(onEdit/onDelete/onReport)이 전달된 항목만 렌더된다. 본인 글은 수정+삭제, 타인 글/스크랩 글은 신고.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReportMenu>;

export const Owner: Story = {
  name: '본인 글 (수정 + 삭제)',
  args: {
    onEdit: () => alert('수정'),
    onDelete: () => alert('삭제'),
  },
};

export const OtherReportOnly: Story = {
  name: '타인 글 (신고만)',
  args: {
    onReport: () => alert('신고'),
  },
};
