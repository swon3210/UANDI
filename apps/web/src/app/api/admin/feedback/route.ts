import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { adminAuth, adminBucket, adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdminEmail } from '@/lib/admin/verify-admin-email';
import type { AdminFeedbackItem, AdminFeedbackPage } from '@/services/admin-feedback';
import type { FeedbackContext, FeedbackStatus, FeedbackType } from '@/types';

const PAGE_SIZE = 20;
const TYPES: FeedbackType[] = ['bug', 'idea', 'other'];
const STATUSES: FeedbackStatus[] = ['new', 'checked', 'resolved'];
const SIGNED_URL_TTL_MS = 60 * 60 * 1000;

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const [url] = await adminBucket()
      .file(path)
      .getSignedUrl({ action: 'read', expires: Date.now() + SIGNED_URL_TTL_MS });
    return url;
  } catch (e) {
    // 에뮬레이터 등 서명 키가 없는 환경 — 썸네일만 빠진다
    console.warn('[admin/feedback] 서명 URL 발급 실패:', e);
    return null;
  }
}

// 어드민 피드백 목록 — ADMIN_EMAILS 계정만(docs/pages/07-feedback.md 「어드민」).
// feedback 은 클라이언트 규칙상 읽을 수 없으므로 Admin SDK로 읽는다. 최신순 20건 + 커서.
export async function GET(req: NextRequest) {
  const result = await verifyAdminEmail(req);
  if (result instanceof NextResponse) return result;

  const params = req.nextUrl.searchParams;
  const type = params.get('type') as FeedbackType | null;
  const status = params.get('status') as FeedbackStatus | null;
  const cursor = params.get('cursor');
  if ((type && !TYPES.includes(type)) || (status && !STATUSES.includes(status))) {
    return NextResponse.json({ error: '잘못된 필터입니다' }, { status: 400 });
  }

  const col = adminDb().collection('feedback');
  let query: Query = col;
  if (type) query = query.where('type', '==', type);
  if (status) query = query.where('status', '==', status);
  query = query.orderBy('createdAt', 'desc');
  if (cursor) {
    const cursorSnap = await col.doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const [snap, newCountSnap] = await Promise.all([
    query.limit(PAGE_SIZE + 1).get(),
    col.where('status', '==', 'new').count().get(),
  ]);
  const docs = snap.docs.slice(0, PAGE_SIZE);

  // 작성자: 이메일은 Auth, 이름·사진은 users 문서 우선(어드민 사용자 표와 같은 규칙)
  const uids = [...new Set(docs.map((d) => d.data().uid as string))];
  const [authResult, userDocs] = uids.length
    ? await Promise.all([
        adminAuth().getUsers(uids.map((uid) => ({ uid }))),
        adminDb().getAll(...uids.map((uid) => adminDb().collection('users').doc(uid))),
      ])
    : [{ users: [] }, []];
  const authByUid = new Map(authResult.users.map((u) => [u.uid, u]));
  const profileByUid = new Map(userDocs.map((d) => [d.id, d.data()]));

  const items: AdminFeedbackItem[] = await Promise.all(
    docs.map(async (d) => {
      const data = d.data();
      const uid = data.uid as string;
      const authUser = authByUid.get(uid);
      const profile = profileByUid.get(uid);
      return {
        id: d.id,
        type: data.type as FeedbackType,
        status: data.status as FeedbackStatus,
        content: data.content as string,
        contactEmail: (data.contactEmail as string | null) ?? null,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
        author: {
          uid,
          email: authUser?.email ?? null,
          displayName:
            (profile?.displayName as string | undefined) || authUser?.displayName || null,
          photoURL: (profile?.photoURL as string | null | undefined) ?? authUser?.photoURL ?? null,
        },
        screenshotUrl: await signedUrl((data.screenshotPath as string | null) ?? null),
        context: data.context as FeedbackContext,
      };
    })
  );

  const body: AdminFeedbackPage = {
    items,
    nextCursor: snap.docs.length > PAGE_SIZE ? docs[docs.length - 1].id : null,
    newCount: newCountSnap.data().count,
  };
  return NextResponse.json(body);
}
