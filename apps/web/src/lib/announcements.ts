import dayjs from 'dayjs';
import type { Announcement } from '@/content/announcements';
import type { User } from '@/types';

/**
 * 안 읽은 공지(최신순)를 돌려준다 — docs/pages/08-announcements.md 「안 읽은 공지 판정」.
 * 1) 마지막으로 본 공지 id가 있으면 그보다 앞(더 최신)에 있는 공지. id를 못 찾으면(지워진 공지) 없음.
 * 2) 본 적이 없으면 가입일보다 뒤 날짜의 공지만(신규 가입자에게 옛 공지를 보여주지 않는다).
 */
export function getUnreadAnnouncements(
  announcements: Announcement[],
  user: Pick<User, 'createdAt' | 'lastSeenAnnouncementId'>
): Announcement[] {
  if (user.lastSeenAnnouncementId) {
    const index = announcements.findIndex((a) => a.id === user.lastSeenAnnouncementId);
    return index === -1 ? [] : announcements.slice(0, index);
  }
  const signupDate = user.createdAt ? dayjs(user.createdAt.toDate()).format('YYYY-MM-DD') : null;
  if (!signupDate) return [];
  return announcements.filter((a) => a.date > signupDate);
}
