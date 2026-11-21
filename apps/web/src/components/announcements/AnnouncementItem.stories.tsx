import type { Meta, StoryObj } from '@storybook/react';
import { ANNOUNCEMENTS } from '@/content/announcements';
import { AnnouncementItem } from './AnnouncementItem';

const meta: Meta<typeof AnnouncementItem> = {
  title: 'Announcements/AnnouncementItem',
  component: AnnouncementItem,
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-xl border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    announcement: ANNOUNCEMENTS[0],
    onLinkClick: (href) => alert(`이동: ${href}`),
  },
};

export default meta;
type Story = StoryObj<typeof AnnouncementItem>;

/** 새 기능 + 설명 스크린샷 + 바로 가기 버튼 (실제 첫 공지) */
export const NewWithImageAndLink: Story = {};

/** 새 기능 + 바로 가기 버튼, 스크린샷 없음 (의견 보내기 공지) */
export const NewWithLink: Story = {
  args: { announcement: ANNOUNCEMENTS.find((a) => a.id === '2026-11-feedback')! },
};

/** 고쳤어요, 바로 가기 없음 (실제 두 번째 공지) */
export const FixedWithoutLink: Story = {
  args: { announcement: ANNOUNCEMENTS[1] },
};

/** 위치가 바뀐 기능 — 새 위치를 화면 이름 그대로 적는다 */
export const Changed: Story = {
  args: {
    announcement: {
      id: 'story-changed',
      date: '2026-10-26',
      kind: 'changed',
      title: '가계부 위쪽 탭이 없어졌어요',
      body: '내역은 대시보드 오른쪽 위 「내역」에서, 현금흐름은 내역의 「예상금액 조회하기」에서 볼 수 있어요.',
    },
  },
};

/** 종료된 기능 */
export const Ended: Story = {
  args: {
    announcement: {
      id: 'story-ended',
      date: '2026-12-01',
      kind: 'ended',
      title: '환테크 화면을 닫았어요',
      body: '많이 쓰이지 않아 정리했어요. 저장한 기록은 남아 있어요.',
    },
  },
};

/** 배지 없는 공지 */
export const NoBadge: Story = {
  args: {
    announcement: {
      id: 'story-plain',
      date: '2026-12-10',
      title: '연말 점검 안내',
      body: '12월 31일 새벽 2시~3시에 잠시 접속이 느릴 수 있어요.',
    },
  },
};

/** 긴 제목·여러 줄 본문 */
export const LongText: Story = {
  args: {
    announcement: {
      id: 'story-long',
      date: '2026-12-20',
      kind: 'new',
      title:
        '이제 카드 이용내역서 PDF를 올리면 내역이 한 번에 정리되고 카테고리까지 자동으로 붙어요',
      body: '카드사 앱에서 받은 이용내역서 PDF를 그대로 올려 주세요.\n비밀번호가 걸려 있으면 생년월일 등으로 열 수 있어요.\n정리된 내역은 저장하기 전에 한 번 확인할 수 있고, 카테고리가 틀렸다면 바로 고칠 수 있어요.',
      link: { label: '내역서 올리러 가기', href: '/inner/cashbook/import' },
    },
  },
};
