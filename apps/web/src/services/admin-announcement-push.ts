import { getAuthHeaders } from '@/services/community-admin';
import { AdminForbiddenError } from '@/services/admin';

// 어드민 공지 푸시 — docs/pages/10-announcement-push.md

/** 발송 전 미리보기(dryRun)와 발송 결과 공통 숫자. */
export type AnnouncementPushCounts = {
  targetCount: number;
  optedOutCount: number;
  noTokenCount: number;
  alreadySentCount: number;
  eligibleCount: number;
};

export type AnnouncementPushResult = AnnouncementPushCounts & {
  // dryRun이 아닐 때만
  pushId?: string;
  sentUserCount?: number;
  /** 기기(토큰) 기준 */
  successCount?: number;
  failureCount?: number;
};

/** 보낸 기록 한 건. 시각은 ISO 문자열. */
export type AnnouncementPushLog = {
  id: string;
  announcementId: string;
  announcementTitle: string;
  targetCount: number;
  sentUserCount: number;
  successCount: number;
  failureCount: number;
  sentByEmail: string;
  createdAt: string | null;
};

/** 한 번에 고를 수 있는 최대 대상 수 */
export const ANNOUNCEMENT_PUSH_MAX_TARGETS = 1000;

async function readError(res: Response, fallback: string): Promise<never> {
  if (res.status === 403) throw new AdminForbiddenError();
  const err = (await res.json().catch(() => ({ error: '' }))) as { error?: string };
  throw new Error(err.error || fallback);
}

export async function pushAnnouncement(
  announcementId: string,
  uids: string[],
  dryRun: boolean
): Promise<AnnouncementPushResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/announcements/${encodeURIComponent(announcementId)}/push`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uids, dryRun }),
  });
  if (!res.ok) await readError(res, dryRun ? '대상을 확인하지 못했어요' : '보내지 못했어요');
  return (await res.json()) as AnnouncementPushResult;
}

export async function fetchAnnouncementPushLogs(): Promise<AnnouncementPushLog[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/admin/announcements/pushes', { headers });
  if (!res.ok) await readError(res, '보낸 기록을 불러오지 못했어요');
  return ((await res.json()) as { logs: AnnouncementPushLog[] }).logs;
}

/** 지금이 21시~8시(KST)인지 — 발송 확인 다이얼로그의 야간 경고 */
export function isNightInKst(now: Date = new Date()): boolean {
  const hour = (now.getUTCHours() + 9) % 24;
  return hour >= 21 || hour < 8;
}
