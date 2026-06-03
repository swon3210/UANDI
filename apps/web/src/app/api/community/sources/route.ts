import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdmin } from '@/lib/community/verify-admin';

// 커뮤니티 크롤 소스 CRUD — admin만. Firestore rule이 클라이언트 write를 전면 차단하므로
// 모든 변경은 이 라우트(verifyAdmin 통과)를 거쳐 Admin SDK로 수행한다.

const COLLECTION = 'communitySources';

function isValidFeedUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function serialize(d: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const data = d.data();
  return {
    id: d.id,
    siteName: data.siteName ?? '',
    feedUrl: data.feedUrl ?? '',
    enabled: data.enabled ?? false,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    lastCrawledAt: data.lastCrawledAt?.toDate?.()?.toISOString() ?? null,
    lastError: data.lastError ?? null,
  };
}

export async function GET(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const snap = await adminDb().collection(COLLECTION).orderBy('createdAt', 'desc').get();
  return NextResponse.json({ sources: snap.docs.map(serialize) });
}

export async function POST(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  let body: { siteName?: string; feedUrl?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const siteName = body.siteName?.trim();
  if (!siteName) {
    return NextResponse.json({ error: '출처명을 입력해주세요' }, { status: 400 });
  }
  if (!isValidFeedUrl(body.feedUrl)) {
    return NextResponse.json({ error: '유효한 피드 URL을 입력해주세요' }, { status: 400 });
  }

  const ref = await adminDb().collection(COLLECTION).add({
    siteName,
    feedUrl: body.feedUrl,
    enabled: true,
    createdAt: FieldValue.serverTimestamp(),
    lastCrawledAt: null,
    lastError: null,
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  let body: { id?: string; siteName?: string; feedUrl?: string; enabled?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.siteName !== undefined) {
    const siteName = body.siteName.trim();
    if (!siteName) return NextResponse.json({ error: '출처명을 입력해주세요' }, { status: 400 });
    update.siteName = siteName;
  }
  if (body.feedUrl !== undefined) {
    if (!isValidFeedUrl(body.feedUrl)) {
      return NextResponse.json({ error: '유효한 피드 URL을 입력해주세요' }, { status: 400 });
    }
    update.feedUrl = body.feedUrl;
  }
  if (body.enabled !== undefined) {
    update.enabled = !!body.enabled;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '변경할 내용이 없습니다' }, { status: 400 });
  }

  const ref = adminDb().collection(COLLECTION).doc(body.id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: '소스를 찾을 수 없습니다' }, { status: 404 });
  }
  await ref.update(update);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  let body: { id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: 'id가 필요합니다' }, { status: 400 });
  }

  await adminDb().collection(COLLECTION).doc(body.id).delete();
  return NextResponse.json({ ok: true });
}
