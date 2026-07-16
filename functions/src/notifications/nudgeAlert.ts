import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { loadUserTokenDocs, sendAndPrune } from './fcmTokens';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

type Nudge = {
  coupleId: string;
  fromUid: string;
  toUid: string;
  type: string;
  message?: string;
  status: string;
  createdAt?: admin.firestore.Timestamp;
};

const CLICK_ACTION = '/inner/cashbook';

/** 콕 찌르기 재발송 쿨다운(ms). 클라이언트 가드와 동일값. (apps/web src/services/nudge.ts) */
const NUDGE_COOLDOWN_MS = 30 * 60 * 1000; // 30분

/**
 * couples/{coupleId}/nudges/{nudgeId} 생성 시 파트너(toUid)에게 가계부 입력 요청 푸시를 보낸다.
 * - 수신자의 NotificationSettings.recordRequest.enabled === false면 skip.
 * - 레이스 방지: 같은 (fromUid → toUid) 넛지가 쿨다운(30분) 이내에 이미 있었다면
 *   이번 넛지는 "너무 이른 중복"이므로 push를 보내지 않는다(클라 가드 우회/더블탭 방지).
 * 발송 패턴은 budgetAlert.ts와 동일.
 */
export const onNudgeCreated = onDocumentCreated(
  {
    document: 'couples/{coupleId}/nudges/{nudgeId}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data() as Nudge;

    if (data.type !== 'record-request') return;

    const { coupleId, nudgeId } = event.params as { coupleId: string; nudgeId: string };
    const { fromUid, toUid } = data;

    if (!toUid || toUid === fromUid) {
      logger.info('nudgeAlert skip: invalid recipient', { coupleId, nudgeId, fromUid, toUid });
      return;
    }

    // 레이스 방지: 동일 (from→to) 넛지가 쿨다운 이내에 이미 있었다면 이번 push는 건너뛴다.
    const thisCreatedAt = data.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
    const recentSnap = await db
      .collection(`couples/${coupleId}/nudges`)
      .where('fromUid', '==', fromUid)
      .where('toUid', '==', toUid)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    const hasRecentBefore = recentSnap.docs.some((d) => {
      if (d.id === nudgeId) return false;
      const other = (d.data().createdAt as admin.firestore.Timestamp | undefined)?.toMillis() ?? 0;
      return other < thisCreatedAt && thisCreatedAt - other < NUDGE_COOLDOWN_MS;
    });
    if (hasRecentBefore) {
      logger.info('nudgeAlert skip: within cooldown of a recent nudge', { coupleId, nudgeId });
      return;
    }

    // 수신자 알림 설정 확인
    const settingsDoc = await db.doc(`users/${toUid}/settings/notifications`).get();
    const settings = settingsDoc.data();
    if (settings && settings.recordRequest?.enabled === false) {
      logger.info('nudgeAlert skip: recordRequest disabled', { toUid });
      return;
    }

    // 수신자 FCM 토큰
    const tokenDocs = await loadUserTokenDocs(db, toUid);
    if (tokenDocs.length === 0) {
      logger.info('nudgeAlert skip: no FCM tokens', { toUid });
      return;
    }

    // 보낸 사람 이름 (본문에 사용)
    const fromDoc = await db.doc(`users/${fromUid}`).get();
    const fromName = (fromDoc.data()?.displayName as string | undefined)?.trim() || '파트너';

    const message = data.message?.trim();
    const body = message
      ? `${fromName}: ${message}`
      : `${fromName}님이 가계부 입력을 요청했어요 🐹`;

    try {
      // 발송 후 무효 토큰은 자동 정리된다(sendAndPrune).
      const res = await sendAndPrune(messaging, tokenDocs, {
        notification: {
          title: 'UANDI 가계부',
          body,
        },
        data: {
          click_action: CLICK_ACTION,
          type: 'record-request',
          nudgeId,
          recipient: 'partner',
        },
      });
      logger.info('nudgeAlert FCM sent', {
        toUid,
        nudgeId,
        successCount: res?.successCount,
        failureCount: res?.failureCount,
      });
    } catch (err) {
      logger.error('nudgeAlert FCM send failed', { toUid, nudgeId, err });
    }
  }
);
