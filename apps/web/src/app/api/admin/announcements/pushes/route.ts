import { NextRequest, NextResponse } from 'next/server';
import type { Timestamp } from 'firebase-admin/firestore';
import { ANNOUNCEMENTS } from '@/content/announcements';
import { adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdminEmail } from '@/lib/admin/verify-admin-email';
import type { AnnouncementPushLog } from '@/services/admin-announcement-push';

const LIMIT = 20;

// 공지 푸시 보낸 기록 최근 20건 — ADMIN_EMAILS 계정만(docs/pages/10-announcement-push.md).
export async function GET(req: NextRequest) {
  const result = await verifyAdminEmail(req);
  if (result instanceof NextResponse) return result;

  const snap = await adminDb()
    .collection('announcementPushes')
    .orderBy('createdAt', 'desc')
    .limit(LIMIT)
    .get();

  const titleById = new Map(ANNOUNCEMENTS.map((a) => [a.id, a.title]));
  const logs: AnnouncementPushLog[] = snap.docs.map((doc) => {
    const d = doc.data();
    const announcementId = d.announcementId as string;
    return {
      id: doc.id,
      announcementId,
      announcementTitle: titleById.get(announcementId) ?? announcementId,
      targetCount: ((d.targetUids as string[] | undefined) ?? []).length,
      sentUserCount: ((d.sentUids as string[] | undefined) ?? []).length,
      successCount: (d.successCount as number | undefined) ?? 0,
      failureCount: (d.failureCount as number | undefined) ?? 0,
      sentByEmail: (d.sentByEmail as string | undefined) ?? '',
      createdAt: (d.createdAt as Timestamp | undefined)?.toDate().toISOString() ?? null,
    };
  });

  return NextResponse.json({ logs });
}
