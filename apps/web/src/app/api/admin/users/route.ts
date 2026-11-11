import { NextRequest, NextResponse } from 'next/server';
import type { UserRecord } from 'firebase-admin/auth';
import { adminAuth, adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdminEmail } from '@/lib/admin/verify-admin-email';
import type { AdminUserRow } from '@/services/admin';

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
      const platforms = new Set(
        tokensSnap.docs.map((d) => d.data().platform as string | undefined).filter(Boolean)
      );

      return {
        uid: u.uid,
        email: u.email ?? null,
        displayName: u.displayName ?? null,
        createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
        coupleId,
        partnerEmail: partnerUid ? (emailByUid.get(partnerUid) ?? null) : null,
        myEntryCount: myCountSnap?.data().count ?? 0,
        coupleEntryCount: coupleId ? (coupleStats.get(coupleId)?.count ?? 0) : 0,
        lastEntryAt: coupleId ? (coupleStats.get(coupleId)?.lastEntryAt ?? null) : null,
        platforms: [...platforms] as string[],
      };
    })
  );

  users.sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? ''));

  return NextResponse.json({ users, generatedAt: new Date().toISOString() });
}
