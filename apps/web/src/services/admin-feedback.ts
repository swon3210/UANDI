import { getAuthHeaders } from '@/services/community-admin';
import { AdminForbiddenError } from '@/services/admin';
import type { FeedbackStatus, FeedbackType } from '@/types';

/** /api/admin/feedback 응답의 피드백 한 건. 시각은 ISO 문자열. */
export type AdminFeedbackItem = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  content: string;
  contactEmail: string | null;
  createdAt: string | null;
  author: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  /** 1시간짜리 서명 URL. 첨부가 없으면 null. */
  screenshotUrl: string | null;
  context: {
    platform: string;
    userAgent: string;
    appVersion: string | null;
    previousPath: string | null;
    viewport: string;
  };
};

export type AdminFeedbackPage = {
  items: AdminFeedbackItem[];
  /** 다음 페이지 커서(마지막 문서 id). 더 없으면 null. */
  nextCursor: string | null;
  /** status=new 전체 개수(필터와 무관). */
  newCount: number;
};

export type AdminFeedbackFilter = {
  type: FeedbackType | 'all';
  status: FeedbackStatus | 'all';
};

export async function fetchAdminFeedback(
  filter: AdminFeedbackFilter,
  cursor: string | null
): Promise<AdminFeedbackPage> {
  const params = new URLSearchParams();
  if (filter.type !== 'all') params.set('type', filter.type);
  if (filter.status !== 'all') params.set('status', filter.status);
  if (cursor) params.set('cursor', cursor);
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/feedback?${params.toString()}`, { headers });
  if (res.status === 403) throw new AdminForbiddenError();
  if (!res.ok) throw new Error('피드백을 불러오지 못했어요');
  return (await res.json()) as AdminFeedbackPage;
}

export async function updateAdminFeedbackStatus(id: string, status: FeedbackStatus) {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/feedback/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('상태를 바꾸지 못했어요');
}
