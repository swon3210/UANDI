import { toast } from 'sonner';
import { buildInviteLink } from '@/services/couple';

/**
 * 초대 링크 공유 — 공유 시트(navigator.share)가 있으면 열고, 없으면 링크를 클립보드에 복사한다.
 * 사용자가 공유 시트를 닫은 경우(AbortError)는 조용히 넘어간다.
 */
export async function shareInviteLink(
  code: string,
  copyToClipboard: (text: string) => Promise<void> | void
): Promise<void> {
  const link = buildInviteLink(code);
  const share = typeof navigator !== 'undefined' ? navigator.share?.bind(navigator) : undefined;

  if (share) {
    try {
      await share({
        title: '말랑 가계부 초대',
        text: `둘이 함께 쓰는 말랑 가계부에 초대해요. 초대 코드: ${code}`,
        url: link,
      });
      return;
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      // 공유 실패 → 복사 폴백
    }
  }

  await copyToClipboard(link);
  toast.success('초대 링크를 복사했어요');
}
