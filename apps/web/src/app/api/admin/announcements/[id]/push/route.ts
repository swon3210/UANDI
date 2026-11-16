import { NextRequest, NextResponse } from 'next/server';
import { ANNOUNCEMENTS } from '@/content/announcements';
import { runAnnouncementPush } from '@/lib/admin/announcement-push';
import { verifyAdminEmail } from '@/lib/admin/verify-admin-email';
import { ANNOUNCEMENT_PUSH_MAX_TARGETS } from '@/services/admin-announcement-push';

// 어드민 공지 푸시 — 미리보기(dryRun)와 발송. ADMIN_EMAILS 계정만(docs/pages/10-announcement-push.md).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await verifyAdminEmail(req);
  if (result instanceof NextResponse) return result;

  const { id } = await params;
  const announcement = ANNOUNCEMENTS.find((a) => a.id === id);
  if (!announcement) {
    return NextResponse.json({ error: '없는 공지예요' }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { uids?: unknown; dryRun?: unknown } | null;
  const rawUids = body?.uids;
  if (
    !Array.isArray(rawUids) ||
    rawUids.length === 0 ||
    !rawUids.every((u): u is string => typeof u === 'string' && u.length > 0 && u.length <= 128)
  ) {
    return NextResponse.json({ error: '대상을 골라 주세요' }, { status: 400 });
  }
  const uids = [...new Set(rawUids)];
  if (uids.length > ANNOUNCEMENT_PUSH_MAX_TARGETS) {
    return NextResponse.json(
      { error: `한 번에 ${ANNOUNCEMENT_PUSH_MAX_TARGETS}명까지 보낼 수 있어요` },
      { status: 400 }
    );
  }

  try {
    const pushResult = await runAnnouncementPush({
      announcement,
      uids,
      dryRun: body?.dryRun !== false,
      sentByEmail: result.email,
    });
    return NextResponse.json(pushResult);
  } catch (e) {
    console.error('[admin/announcements/push] 실패:', e);
    return NextResponse.json({ error: '보내지 못했어요' }, { status: 500 });
  }
}
