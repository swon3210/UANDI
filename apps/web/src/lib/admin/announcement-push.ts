import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import type { BatchResponse, MulticastMessage } from 'firebase-admin/messaging';
import { adminDb, adminMessaging } from '@/lib/ai/firebase-admin';
import type { Announcement } from '@/content/announcements';
import { buildAnnouncementPushText } from '@/lib/announcement-push-message';
import type { AnnouncementPushResult } from '@/services/admin-announcement-push';

// 어드민 공지 푸시 발송 — docs/pages/10-announcement-push.md

const COLLECTION = 'announcementPushes';
/** FCM 멀티캐스트 한 번에 보낼 수 있는 최대 토큰 수 */
const FCM_BATCH = 500;
/** 푸시를 누르면 열리는 화면. from=push 면 ←가 항상 대시보드로 간다 */
export const ANNOUNCEMENT_PUSH_CLICK_ACTION = '/announcements?from=push';

// 영구 무효 토큰 — 앱 삭제/재설치 등으로 더 이상 닿지 않는다(functions/src/notifications/fcmTokens.ts 와 같은 목록).
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

type TokenDoc = { uid: string; ref: DocumentReference; token: string };

/**
 * 에뮬레이터(E2E)에는 FCM이 없으므로 USE_PUSH_MOCK=true 면 실제로 보내지 않는다.
 * 토큰마다 성공으로 처리하되 'invalid-' 로 시작하면 등록 해제 에러로 실패시킨다(정리 검증용).
 */
async function sendMulticast(message: MulticastMessage): Promise<BatchResponse> {
  if (process.env.USE_PUSH_MOCK === 'true') {
    const responses = message.tokens.map((token) =>
      token.startsWith('invalid-')
        ? {
            success: false,
            error: { code: 'messaging/registration-token-not-registered' },
          }
        : { success: true, messageId: `mock-${token}` }
    ) as BatchResponse['responses'];
    const successCount = responses.filter((r) => r.success).length;
    return { responses, successCount, failureCount: responses.length - successCount };
  }
  return adminMessaging().sendEachForMulticast(message);
}

function buildMessage(announcement: Announcement): Omit<MulticastMessage, 'tokens'> {
  return {
    // 제목은 종류별 고정 문구, 본문은 공지 제목
    notification: buildAnnouncementPushText(announcement),
    data: {
      click_action: ANNOUNCEMENT_PUSH_CLICK_ACTION,
      type: 'announcement',
      announcementId: announcement.id,
    },
  };
}

/** 같은 공지를 이미 받은 사용자(기존 기록들의 sentUids 합집합). */
async function loadAlreadySentUids(announcementId: string): Promise<Set<string>> {
  const snap = await adminDb()
    .collection(COLLECTION)
    .where('announcementId', '==', announcementId)
    .get();
  const sent = new Set<string>();
  for (const doc of snap.docs) {
    for (const uid of (doc.data().sentUids as string[] | undefined) ?? []) sent.add(uid);
  }
  return sent;
}

/** 알림 설정에서 「공지 알림」을 끈 사용자. 설정 문서가 없거나 필드가 없으면 켜짐. */
async function loadOptedOutUids(uids: string[]): Promise<Set<string>> {
  if (uids.length === 0) return new Set();
  const db = adminDb();
  const snaps = await db.getAll(
    ...uids.map((uid) => db.doc(`users/${uid}/settings/notifications`))
  );
  const optedOut = new Set<string>();
  snaps.forEach((snap, i) => {
    if (snap.exists && snap.get('announcement.enabled') === false) optedOut.add(uids[i]!);
  });
  return optedOut;
}

async function loadTokens(uids: string[]): Promise<Map<string, TokenDoc[]>> {
  const db = adminDb();
  const entries = await Promise.all(
    uids.map(async (uid) => {
      const snap = await db.collection(`users/${uid}/fcmTokens`).get();
      const tokens = snap.docs
        .map((d) => ({ uid, ref: d.ref, token: d.get('token') as string | undefined }))
        .filter((t): t is TokenDoc => Boolean(t.token));
      return [uid, tokens] as const;
    })
  );
  return new Map(entries);
}

/**
 * 대상을 거른 뒤(이미 보냄 → 공지 알림 끔 → 기기 없음 순, 한 사람은 한 항목에만) 미리보기 숫자를 돌려주고,
 * dryRun 이 아니면 실제로 보내고 무효 토큰을 정리한 뒤 기록을 남긴다.
 */
export async function runAnnouncementPush({
  announcement,
  uids,
  dryRun,
  sentByEmail,
}: {
  announcement: Announcement;
  uids: string[];
  dryRun: boolean;
  sentByEmail: string;
}): Promise<AnnouncementPushResult> {
  const alreadySent = await loadAlreadySentUids(announcement.id);
  const notSent = uids.filter((uid) => !alreadySent.has(uid));
  const optedOut = await loadOptedOutUids(notSent);
  const candidates = notSent.filter((uid) => !optedOut.has(uid));
  const tokensByUid = await loadTokens(candidates);
  const eligible = candidates.filter((uid) => (tokensByUid.get(uid)?.length ?? 0) > 0);

  const counts = {
    targetCount: uids.length,
    alreadySentCount: uids.length - notSent.length,
    optedOutCount: optedOut.size,
    noTokenCount: candidates.length - eligible.length,
    eligibleCount: eligible.length,
  };
  if (dryRun || eligible.length === 0) return counts;

  const tokenDocs = eligible.flatMap((uid) => tokensByUid.get(uid) ?? []);
  const message = buildMessage(announcement);
  const delivered = new Set<string>();
  const stale: DocumentReference[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokenDocs.length; i += FCM_BATCH) {
    const batch = tokenDocs.slice(i, i + FCM_BATCH);
    const res = await sendMulticast({ ...message, tokens: batch.map((t) => t.token) });
    successCount += res.successCount;
    failureCount += res.failureCount;
    res.responses.forEach((r, j) => {
      const doc = batch[j]!;
      if (r.success) delivered.add(doc.uid);
      else if (r.error?.code && INVALID_TOKEN_CODES.has(r.error.code)) stale.push(doc.ref);
    });
  }

  if (stale.length > 0) {
    await Promise.all(
      stale.map((ref) =>
        ref.delete().catch((e) => console.warn('[announcement-push] 무효 토큰 삭제 실패:', e))
      )
    );
  }

  const sentUids = eligible.filter((uid) => delivered.has(uid));
  const ref = adminDb().collection(COLLECTION).doc();
  await ref.set({
    announcementId: announcement.id,
    targetUids: uids,
    sentUids,
    optedOutCount: counts.optedOutCount,
    noTokenCount: counts.noTokenCount,
    alreadySentCount: counts.alreadySentCount,
    successCount,
    failureCount,
    sentByEmail,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ...counts, pushId: ref.id, sentUserCount: sentUids.length, successCount, failureCount };
}
