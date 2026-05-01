import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

if (!admin.apps.length) admin.initializeApp();

type SendTestPushResult = {
  successCount: number;
  failureCount: number;
  failures: Array<{ index: number; error: string }>;
};

/**
 * 본인의 등록된 FCM 토큰들로 테스트 푸시 1건을 발송한다.
 * 알림 셋업이 정상인지 검증할 때 사용.
 */
export const sendTestPush = onCall(
  { region: 'asia-northeast3' },
  async (request): Promise<SendTestPushResult> => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', '로그인이 필요해요.');
    }

    const tokensSnap = await admin
      .firestore()
      .collection(`users/${uid}/fcmTokens`)
      .get();
    const tokens = tokensSnap.docs
      .map((d) => d.data().token as string | undefined)
      .filter((t): t is string => Boolean(t));

    if (tokens.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        '등록된 FCM 토큰이 없어요. 알림 토글을 ON으로 저장해 토큰을 등록해주세요.'
      );
    }

    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'UANDI 테스트 알림',
        body: '푸시가 정상적으로 도착했어요 🎉',
      },
      data: {
        click_action: '/cashbook/history/weekly/notifications',
      },
    });

    const failures = result.responses
      .map((r, i) => ({ index: i, error: r.error?.message ?? '' }))
      .filter((f) => f.error);

    if (failures.length > 0) {
      logger.warn('sendTestPush failures', { uid, failures });
    }

    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      failures,
    };
  }
);
