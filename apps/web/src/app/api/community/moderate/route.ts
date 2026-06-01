import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdmin } from '@/lib/community/verify-admin';

type ModerateAction = 'approve' | 'reject' | 'hide' | 'keep';

const VALID_ACTIONS: ModerateAction[] = ['approve', 'reject', 'hide', 'keep'];

export async function POST(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  let body: { postId?: string; action?: ModerateAction };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const { postId, action } = body;
  if (!postId || !action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'postId와 유효한 action이 필요합니다' }, { status: 400 });
  }

  const postRef = adminDb().collection('communityPosts').doc(postId);
  const snap = await postRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: '글을 찾을 수 없습니다' }, { status: 404 });
  }

  switch (action) {
    case 'approve':
      await postRef.update({
        status: 'published',
        publishedAt: FieldValue.serverTimestamp(),
      });
      break;
    case 'reject':
    case 'hide':
      await postRef.update({ status: 'hidden' });
      break;
    case 'keep':
      await postRef.update({ reportCount: 0 });
      break;
  }

  return NextResponse.json({ ok: true });
}
