import type { Meta, StoryObj } from '@storybook/react';
import { CoupleStatusCard } from './CoupleStatusCard';
import coralMascot from '../../assets/mascot-couple-coral.png';
import sageMascot from '../../assets/mascot-couple-sage.png';
import splashMascot from '../../assets/mascot-splash.png';

const meta: Meta<typeof CoupleStatusCard> = {
  title: 'Inner/CoupleStatusCard',
  component: CoupleStatusCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '대시보드 최상단 "커플 카드". 왼쪽(나·코랄)은 한마디를 쓰는 자리, 오른쪽(짝꿍·세이지)은 접속 상태와 한마디를 보는 자리로 비대칭 구성한다. ' +
          '무상태 프레젠테이션 — 접속 상태/한마디/상대시간 라벨은 모두 props 로 주입한다. 마스코트는 `@uandi/ui/assets/mascot-couple-*.png` 에서 온다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CoupleStatusCard>;

const me = { name: '나', message: '먼저 자~', mascotSrc: coralMascot };
const partner = { name: '지훈', message: '오늘도 고마워 ❤️', mascotSrc: sageMascot };

/** 1. 기본 — 짝꿍 접속 중 + 양쪽 한마디 */
export const Default: Story = {
  name: '기본 (접속 중)',
  args: {
    state: 'connected',
    me,
    partner,
    partnerPresence: 'online',
    partnerLastSeenLabel: '조금 전',
    onEditMyMessage: () => {},
  },
};

/** 2. 짝꿍 오프라인 — 마스코트 디밍 + "2시간 전" */
export const PartnerOffline: Story = {
  name: '짝꿍 오프라인',
  args: {
    state: 'connected',
    me,
    partner,
    partnerPresence: 'offline',
    partnerLastSeenLabel: '2시간 전',
    onEditMyMessage: () => {},
  },
};

/** 3. 짝꿍이 한마디를 새로 남김 — 하이라이트 뱃지 */
export const UnreadPartnerMessage: Story = {
  name: '새 한마디 알림',
  args: {
    state: 'connected',
    me,
    partner: { ...partner, message: '점심 뭐 먹었어? 나 방금 카드값 기록했어!' },
    partnerPresence: 'online',
    partnerLastSeenLabel: '조금 전',
    hasUnreadPartnerMessage: true,
    onEditMyMessage: () => {},
  },
};

/** 4. 내 한마디 비어있음 — placeholder 유도 */
export const MyMessageEmpty: Story = {
  name: '내 한마디 없음',
  args: {
    state: 'connected',
    me: { ...me, message: null },
    partner,
    partnerPresence: 'online',
    partnerLastSeenLabel: '조금 전',
    onEditMyMessage: () => {},
  },
};

/** 5. 짝꿍 한마디 비어있음 */
export const PartnerMessageEmpty: Story = {
  name: '짝꿍 한마디 없음',
  args: {
    state: 'connected',
    me,
    partner: { ...partner, message: null },
    partnerPresence: 'offline',
    partnerLastSeenLabel: '어제',
    onEditMyMessage: () => {},
  },
};

/** 6. 긴 한마디 — 2줄 말줄임 */
export const LongMessage: Story = {
  name: '긴 한마디 (말줄임)',
  args: {
    state: 'connected',
    me: { ...me, message: '오늘 진짜 너무 고마웠어 앞으로도 잘 부탁해 사랑해 많이많이' },
    partner: { ...partner, message: '나도 사랑해 우리 이번 달 가계부도 같이 잘 정리해보자 화이팅' },
    partnerPresence: 'online',
    partnerLastSeenLabel: '조금 전',
    onEditMyMessage: () => {},
  },
};

/** 7. 커플 미연결 — 짝꿍 초대 CTA */
export const NotConnected: Story = {
  name: '커플 미연결 (초대)',
  args: {
    state: 'invite',
    mascotSrc: splashMascot,
    onInvite: () => {},
  },
};

/** 8. 로딩 */
export const Loading: Story = {
  name: '로딩',
  args: {
    state: 'loading',
  },
};
