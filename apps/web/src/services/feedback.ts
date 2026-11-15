import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { uploadFeedbackScreenshot } from '@/lib/firebase/storage';
import type { FeedbackContext, FeedbackType } from '@/types';

export type SubmitFeedbackInput = {
  uid: string;
  coupleId: string | null;
  type: FeedbackType;
  content: string;
  contactEmail: string | null;
  /** 압축된 스크린샷. 없으면 null. */
  screenshot: File | null;
  context: FeedbackContext;
};

/** 새 피드백 id. 스크린샷 경로에 쓰려고 문서보다 먼저 만든다. */
export function newFeedbackId(): string {
  return doc(collection(getDb(), 'feedback')).id;
}

/**
 * 의견 보내기(docs/pages/07-feedback.md). 스크린샷을 먼저 올리고 문서를 만든다.
 * 같은 feedbackId로 재시도하면 스크린샷·문서가 같은 경로로 다시 쓰인다(문서는 생성 규칙만 있어 첫 성공 후엔 거부).
 */
export async function submitFeedback(feedbackId: string, input: SubmitFeedbackInput) {
  const screenshotPath = input.screenshot
    ? await uploadFeedbackScreenshot({ uid: input.uid, feedbackId, file: input.screenshot })
    : null;

  await setDoc(doc(getDb(), 'feedback', feedbackId), {
    uid: input.uid,
    coupleId: input.coupleId,
    type: input.type,
    content: input.content,
    contactEmail: input.contactEmail,
    screenshotPath,
    context: input.context,
    status: 'new',
    createdAt: serverTimestamp(),
    statusUpdatedAt: null,
  });
}
