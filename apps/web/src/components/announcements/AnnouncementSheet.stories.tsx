import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { ANNOUNCEMENTS, type Announcement } from '@/content/announcements';
import { AnnouncementSheet } from './AnnouncementSheet';

const extra: Announcement[] = [
  {
    id: 'story-3',
    date: '2026-10-26',
    kind: 'changed',
    title: '가계부 위쪽 탭이 없어졌어요',
    body: '내역은 대시보드 오른쪽 위 「내역」에서, 현금흐름은 내역의 「예상금액 조회하기」에서 볼 수 있어요.',
  },
  {
    id: 'story-4',
    date: '2026-10-01',
    kind: 'new',
    title: '짝꿍에게 콕 찌르기를 보낼 수 있어요',
    body: '가계부를 같이 적고 싶을 때 대시보드 아래 버튼으로 알려 주세요.',
  },
];

const meta: Meta<typeof AnnouncementSheet> = {
  title: 'Announcements/AnnouncementSheet',
  component: AnnouncementSheet,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    announcements: ANNOUNCEMENTS,
    onConfirm: () => alert('확인'),
    onLinkClick: (href) => alert(`이동: ${href}`),
    onSeeAll: () => alert('지난 공지 모두 보기'),
  },
};

export default meta;
type Story = StoryObj<typeof AnnouncementSheet>;

/** 실제 첫 배포 상태 — 공지 2개 */
export const Default: Story = {};

/** 안 읽은 공지 1개 */
export const Single: Story = {
  args: { announcements: [ANNOUNCEMENTS[1]] },
};

/** 정확히 3개 — 「모두 보기」 없음 */
export const Three: Story = {
  args: { announcements: [...ANNOUNCEMENTS, extra[0]] },
};

/** 3개 초과 — 최신 3개만 보이고 「지난 공지 모두 보기」 */
export const MoreThanThree: Story = {
  args: { announcements: [...ANNOUNCEMENTS, ...extra] },
};
