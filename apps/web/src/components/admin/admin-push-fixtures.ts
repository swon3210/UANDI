import type { Announcement } from '@/content/announcements';
import type {
  AnnouncementPushCounts,
  AnnouncementPushLog,
} from '@/services/admin-announcement-push';

// 공지 푸시 스토리용 샘플 — docs/pages/10-announcement-push.md

export const SAMPLE_PUSH_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'story-invite',
    date: '2026-11-16',
    kind: 'fixed',
    title: '초대 코드에 영문을 입력할 수 없던 문제를 고쳤어요',
    body: '초대 코드 입력칸에 숫자 키패드만 떠서, 영문이 섞인 코드를 넣을 수 없었어요.\n이제 영문과 숫자를 모두 입력할 수 있어요.',
  },
  {
    id: 'story-feedback',
    date: '2026-11-15',
    kind: 'new',
    title: '앱 안에서 의견을 보낼 수 있어요',
    body: '불편한 점이나 바라는 점이 있으면 설정 → 의견 보내기로 알려 주세요.',
  },
];

export const SAMPLE_PUSH_PREVIEW: AnnouncementPushCounts = {
  targetCount: 12,
  alreadySentCount: 2,
  optedOutCount: 1,
  noTokenCount: 3,
  eligibleCount: 6,
};

export const SAMPLE_PUSH_LOGS: AnnouncementPushLog[] = [
  {
    id: 'log-2',
    announcementId: 'story-invite',
    announcementTitle: '초대 코드에 영문을 입력할 수 없던 문제를 고쳤어요',
    targetCount: 8,
    sentUserCount: 6,
    successCount: 7,
    failureCount: 1,
    sentByEmail: 'admin@example.com',
    createdAt: '2026-11-16T10:12:00+09:00',
  },
  {
    id: 'log-1',
    announcementId: 'story-feedback',
    announcementTitle: '앱 안에서 의견을 보낼 수 있어요',
    targetCount: 30,
    sentUserCount: 24,
    successCount: 26,
    failureCount: 0,
    sentByEmail: 'admin@example.com',
    createdAt: '2026-11-15T14:40:00+09:00',
  },
];
