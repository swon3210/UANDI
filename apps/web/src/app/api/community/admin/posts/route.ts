import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdmin } from '@/lib/community/verify-admin';

// 모더레이션 목록 조회 — admin만.
// Firestore rule이 클라이언트의 pending/reported read를 차단하므로 서버에서 Admin SDK로 직접 읽어 반환.
export async function GET(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  const col = adminDb().collection('communityPosts');

  const [pendingSnap, reportedSnap] = await Promise.all([
    col.where('status', '==', 'pending').orderBy('createdAt', 'desc').limit(50).get(),
    col
      .where('status', '==', 'published')
      .where('reportCount', '>=', 1)
      .orderBy('reportCount', 'desc')
      .limit(50)
      .get(),
  ]);

  const toSerializable = (
    d: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // Timestamp → ISO string. Firestore Timestamp는 toDate를 제공한다.
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() ?? null,
    };
  };

  return NextResponse.json({
    pending: pendingSnap.docs.map(toSerializable),
    reported: reportedSnap.docs.map(toSerializable),
  });
}
