import { NextRequest, NextResponse } from 'next/server';
import type { UserRecord } from 'firebase-admin/auth';
import { adminAuth, adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdminEmail } from '@/lib/admin/verify-admin-email';
import type { AdminUserPlatform, AdminUserRow } from '@/services/admin';

// 어드민 사용자 현황 — ADMIN_EMAILS 계정만(docs/pages/06-admin.md).
// 다른 사용자의 users/·couples/ 문서는 클라이언트 규칙상 읽을 수 없으므로 Admin SDK로 읽어 건수만 반환한다.
export async function GET(req: NextRequest) {
  const result = await verifyAdminEmail(req);
  if (result instanceof NextResponse) return result;

  const db = adminDb();

  const authUsers: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth().listUsers(1000, pageToken);
    authUsers.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  const userDocs = authUsers.length
    ? await db.getAll(...authUsers.map((u) => db.collection('users').doc(u.uid)))
    : [];
  const coupleIdByUid = new Map<string, string | null>(
    userDocs.map((d) => [d.id, (d.data()?.coupleId as string | null | undefined) ?? null])
  );
  // 이름·사진은 앱에서 바꿀 수 있어 users/{uid} 문서가 단일 소스다(없으면 Auth 값).
  const profileByUid = new Map(
    userDocs.map((d) => {
      const data = d.data();
      return [
        d.id,
        {
          displayName: (data?.displayName as string | undefined) || null,
          photoURL: (data?.photoURL as string | null | undefined) ?? null,
          clientPlatforms: (data?.clientPlatforms ?? {}) as Record<
            string,
            FirebaseFirestore.Timestamp | undefined
          >,
        },
      ];
    })
  );
  const emailByUid = new Map(authUsers.map((u) => [u.uid, u.email ?? null]));

  const entriesOf = (coupleId: string) =>
    db.collection('couples').doc(coupleId).collection('cashbookEntries');

  const coupleIds = [...new Set([...coupleIdByUid.values()].filter((id): id is string => !!id))];
  const coupleStats = new Map(
    await Promise.all(
      coupleIds.map(async (coupleId) => {
        const [countSnap, lastSnap] = await Promise.all([
          entriesOf(coupleId).count().get(),
          entriesOf(coupleId).orderBy('createdAt', 'desc').limit(1).get(),
        ]);
        const lastEntryAt = lastSnap.docs[0]?.data().createdAt?.toDate?.()?.toISOString() ?? null;
        return [coupleId, { count: countSnap.data().count, lastEntryAt }] as const;
      })
    )
  );

  const users: AdminUserRow[] = await Promise.all(
    authUsers.map(async (u) => {
      const coupleId = coupleIdByUid.get(u.uid) ?? null;
      const [myCountSnap, tokensSnap] = await Promise.all([
        coupleId ? entriesOf(coupleId).where('createdBy', '==', u.uid).count().get() : null,
        db.collection('users').doc(u.uid).collection('fcmTokens').get(),
      ]);
      const partnerUid = coupleId
        ? [...coupleIdByUid.entries()].find(([uid, id]) => id === coupleId && uid !== u.uid)?.[0]
        : undefined;
      const lastActive = u.metadata.lastRefreshTime ?? u.metadata.lastSignInTime;
      // 앱을 연 기록(clientPlatforms)이 기본이고, 기록 도입 전 사용자는 푸시 토큰의 플랫폼으로 보완한다.
      const lastSeenByPlatform = new Map<string, string | null>(
        Object.entries(profileByUid.get(u.uid)?.clientPlatforms ?? {}).map(([name, ts]) => [
          name,
          ts?.toDate?.()?.toISOString() ?? null,
        ])
      );
      for (const d of tokensSnap.docs) {
        const name = d.data().platform as string | undefined;
        if (name && !lastSeenByPlatform.has(name)) lastSeenByPlatform.set(name, null);
      }
      const platforms: AdminUserPlatform[] = [...lastSeenByPlatform]
        .map(([name, lastSeenAt]) => ({ name, lastSeenAt }))
        .sort((a, b) => (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? ''));

      return {
        uid: u.uid,
        email: u.email ?? null,
        displayName: profileByUid.get(u.uid)?.displayName ?? u.displayName ?? null,
        photoURL: profileByUid.get(u.uid)?.photoURL ?? u.photoURL ?? null,
        createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
        coupleId,
        partnerEmail: partnerUid ? (emailByUid.get(partnerUid) ?? null) : null,
        myEntryCount: myCountSnap?.data().count ?? 0,
        coupleEntryCount: coupleId ? (coupleStats.get(coupleId)?.count ?? 0) : 0,
        lastEntryAt: coupleId ? (coupleStats.get(coupleId)?.lastEntryAt ?? null) : null,
        platforms,
      };
    })
  );

  users.sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? ''));

  return NextResponse.json({ users, generatedAt: new Date().toISOString() });
}
