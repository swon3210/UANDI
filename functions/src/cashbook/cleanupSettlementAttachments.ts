import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// 점검을 완료하지 않은 채 방치된 첨부(카드·계좌 명세 이미지)를 보관하는 최대 기간.
// 정상 흐름에서는 점검 완료 시 즉시 삭제되지만, 미완료로 남거나 완료 시 삭제가
// 실패해 잔존한 이미지를 정기적으로 정리하는 안전망이다(개인정보처리방침 3조 참고).
const RETENTION_DAYS = 30;

type SettlementAttachment = {
  id?: string;
  storagePath?: string;
};

/**
 * 매일 새벽, 30일 이상 갱신되지 않은 미완료(draft) 점검 문서의 첨부 이미지를
 * Storage에서 삭제하고 Firestore의 attachments 배열을 비운다.
 * 점검 문서 자체(예산/보고서 초안)는 남겨두고 첨부 이미지만 제거한다.
 */
export const cleanupSettlementAttachments = onSchedule(
  {
    schedule: 'every day 04:00',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
  },
  async () => {
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - RETENTION_DAYS * 86_400_000);

    // 미완료(draft) + 마지막 갱신이 cutoff 이전인 결산만 조회 (전체 스캔 회피)
    const snap = await db
      .collectionGroup('cashbookSettlements')
      .where('status', '==', 'draft')
      .where('updatedAt', '<', cutoff)
      .get();

    logger.info('cleanupSettlementAttachments start', { candidateCount: snap.size });

    const bucket = admin.storage().bucket();
    let deletedFiles = 0;
    let clearedDocs = 0;

    for (const doc of snap.docs) {
      const attachments = (doc.data().attachments as SettlementAttachment[] | undefined) ?? [];
      if (attachments.length === 0) continue;

      for (const att of attachments) {
        if (!att.storagePath) continue;
        try {
          await bucket.file(att.storagePath).delete();
          deletedFiles += 1;
        } catch (err: unknown) {
          // 이미 삭제된 객체(404)는 무시, 그 외만 로깅
          const code = (err as { code?: number })?.code;
          if (code !== 404) {
            logger.warn('cleanupSettlementAttachments delete failed', {
              path: att.storagePath,
              err,
            });
          }
        }
      }

      try {
        await doc.ref.update({
          attachments: [],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        clearedDocs += 1;
      } catch (err) {
        logger.error('cleanupSettlementAttachments doc update failed', {
          path: doc.ref.path,
          err,
        });
      }
    }

    logger.info('cleanupSettlementAttachments done', { deletedFiles, clearedDocs });
  }
);
