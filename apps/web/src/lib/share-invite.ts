import { toast } from 'sonner';
import { buildInviteLink } from '@/services/couple';

export type ShareInviteLabels = {
  /** 공유 시트 제목 (onboarding.share.title) */
  title: string;
  /** 공유 본문 — 코드가 이미 들어간 완성 문장 (onboarding.share.text) */
  text: string;
  /** 공유 API가 없어 링크를 복사했을 때 토스트 (onboarding.share.copied) */
  copied: string;
};

/**
 * 초대 링크 공유 — 공유 시트(navigator.share)가 있으면 열고, 없으면 링크를 클립보드에 복사한다.
 * 사용자가 공유 시트를 닫은 경우(AbortError)는 조용히 넘어간다.
 * 문구는 호출 측이 `useTranslations('onboarding.share')` 로 만들어 넘긴다(순수 함수라 훅을 못 쓴다).
 */
export async function shareInviteLink(
  code: string,
  copyToClipboard: (text: string) => Promise<void> | void,
  labels: ShareInviteLabels
): Promise<void> {
  const link = buildInviteLink(code);
  const share = typeof navigator !== 'undefined' ? navigator.share?.bind(navigator) : undefined;

  if (share) {
    try {
      await share({ title: labels.title, text: labels.text, url: link });
      return;
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      // 공유 실패 → 복사 폴백
    }
  }

  await copyToClipboard(link);
  toast.success(labels.copied);
}
