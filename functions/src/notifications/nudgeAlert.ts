import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

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

/**
 * couples/{coupleId}/nudges/{nudgeId} 생성 시 파트너(toUid)에게 가계부 입력 요청 푸시를 보낸다.
 * - 수신자의 NotificationSettings.recordRequest.enabled === false면 skip.
 * - 레이스 방지: 같은 (fromUid → toUid) pending 넛지 중 가장 오래된 것만 발송(중복 방지).
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

    // 레이스 방지: 동일 (from→to) pending 넛지가 여럿이면 가장 오래된 것만 발송한다.
    const pendingSnap = await db
      .collection(`couples/${coupleId}/nudges`)
      .where('fromUid', '==', fromUid)
      .where('toUid', '==', toUid)
      .where('status', '==', 'pending')
      .get();

    if (pendingSnap.size > 1) {
      const thisCreatedAt = data.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
      const hasOlder = pendingSnap.docs.some((d) => {
        if (d.id === nudgeId) return false;
        const other = (d.data().createdAt as admin.firestore.Timestamp | undefined)?.toMillis() ?? 0;
        return other < thisCreatedAt;
      });
      if (hasOlder) {
        logger.info('nudgeAlert skip: older pending nudge exists', { coupleId, nudgeId });
        return;
      }
    }

    // 수신자 알림 설정 확인
    const settingsDoc = await db.doc(`users/${toUid}/settings/notifications`).get();
    const settings = settingsDoc.data();
    if (settings && settings.recordRequest?.enabled === false) {
      logger.info('nudgeAlert skip: recordRequest disabled', { toUid });
      return;
    }

    // 수신자 FCM 토큰
    const tokensSnap = await db.collection(`users/${toUid}/fcmTokens`).get();
    const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);
    if (tokens.length === 0) {
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
      const res = await messaging.sendEachForMulticast({
        tokens,
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
        successCount: res.successCount,
        failureCount: res.failureCount,
      });
    } catch (err) {
      logger.error('nudgeAlert FCM send failed', { toUid, nudgeId, err });
    }
  }
);
