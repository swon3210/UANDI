'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FeedbackForm, FeedbackResponseNotice, Header, type FeedbackFormSubmit } from '@uandi/ui';
import { BackButton, goBackOrReplace } from '@/components/shell/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitFeedback } from '@/hooks/useSubmitFeedback';

const PARENT = '/settings';

/** 의견 보내기 — 피드백·버그 제보(docs/pages/07-feedback.md). */
export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const submit = useSubmitFeedback(user ?? null);

  if (!user) return null;

  const handleSubmit = async (values: FeedbackFormSubmit) => {
    try {
      await submit.mutateAsync(values);
    } catch (e) {
      console.error('[feedback] 제출 실패:', e);
      toast.error('보내지 못했어요. 잠시 후 다시 시도해 주세요');
      return;
    }
    toast.success('보내 주셔서 고마워요', { description: '주말에 확인하고 답장할게요' });
    goBackOrReplace(router, PARENT);
  };

  return (
    <div className="flex min-h-screen flex-col" data-testid="feedback-page">
      <Header title="의견 보내기" leftSlot={<BackButton fallbackHref={PARENT} />} />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
        <p className="mb-6 text-sm text-muted-foreground">
          불편한 점이나 바라는 점을 알려 주세요. 하나하나 읽어 볼게요.
        </p>
        <FeedbackForm
          defaultEmail={user.email}
          onSubmit={handleSubmit}
          isPending={submit.isPending}
        />
        <FeedbackResponseNotice className="mt-8" />
      </main>
    </div>
  );
}
