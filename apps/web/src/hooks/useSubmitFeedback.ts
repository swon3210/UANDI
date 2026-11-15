import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { FeedbackFormSubmit } from '@uandi/ui';
import { trackEvent, sanitizePath } from '@/lib/analytics';
import { getClientPlatform } from '@/lib/native';
import { getPreviousPath } from '@/lib/nav-history';
import { newFeedbackId, submitFeedback } from '@/services/feedback';
import { compressImage } from '@/utils/image-compress';
import type { FeedbackContext, User } from '@/types';

/** 자동 첨부 정보. 가계부 내용은 담지 않는다. */
function collectContext(): FeedbackContext {
  const previous = getPreviousPath();
  const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  return {
    platform: getClientPlatform(),
    userAgent: navigator.userAgent.slice(0, 512),
    appVersion: sha ? sha.slice(0, 7) : null,
    previousPath: previous ? sanitizePath(previous.split('?')[0]) : null,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

/** 의견 보내기 제출. 실패 후 재시도해도 같은 피드백 id를 쓴다. */
export function useSubmitFeedback(user: User | null) {
  const feedbackIdRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (values: FeedbackFormSubmit) => {
      if (!user) throw new Error('NOT_AUTHENTICATED');
      feedbackIdRef.current ??= newFeedbackId();
      const screenshot = values.screenshot ? await compressImage(values.screenshot) : null;
      await submitFeedback(feedbackIdRef.current, {
        uid: user.uid,
        coupleId: user.coupleId,
        type: values.type,
        content: values.content,
        contactEmail: values.contactEmail,
        screenshot,
        context: collectContext(),
      });
    },
    onSuccess: (_data, values) => {
      feedbackIdRef.current = null;
      trackEvent('feedback_submit', { type: values.type });
    },
  });
}
