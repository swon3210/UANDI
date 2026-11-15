import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdminEmail } from '@/lib/admin/verify-admin-email';
import type { FeedbackStatus } from '@/types';

const STATUSES: FeedbackStatus[] = ['new', 'checked', 'resolved'];

// 피드백 상태 변경(신규/확인/해결) — ADMIN_EMAILS 계정만. 클라이언트 규칙은 update를 막는다.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await verifyAdminEmail(req);
  if (result instanceof NextResponse) return result;

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status as FeedbackStatus | undefined;
  if (!status || !STATUSES.includes(status)) {
    return NextResponse.json({ error: '잘못된 상태입니다' }, { status: 400 });
  }

  const ref = adminDb().collection('feedback').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  await ref.update({ status, statusUpdatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}
