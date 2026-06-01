import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// 명세: docs/pages/community/community-feed.md (Phase 4)
// 신고 누적이 임계치에 도달하면 자동으로 status='hidden'으로 내려 피드에서 빠진다.
const HIDE_THRESHOLD = 3;

export const onCommunityReportCreated = onDocumentCreated(
  {
    document: 'communityPosts/{postId}/reports/{reporterUid}',
    region: 'asia-northeast3',
  },
  async (event) => {
    const { postId } = event.params as { postId: string };
    const postRef = db.collection('communityPosts').doc(postId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(postRef);
      if (!snap.exists) {
        logger.warn('onCommunityReportCreated: post not found', { postId });
        return;
      }
      const data = snap.data() ?? {};
      const currentCount = typeof data.reportCount === 'number' ? data.reportCount : 0;
      const newCount = currentCount + 1;
      const update: Record<string, unknown> = { reportCount: newCount };
      if (newCount >= HIDE_THRESHOLD && data.status === 'published') {
        update.status = 'hidden';
      }
      tx.update(postRef, update);
    });

    logger.info('onCommunityReportCreated processed', { postId });
  }
);
