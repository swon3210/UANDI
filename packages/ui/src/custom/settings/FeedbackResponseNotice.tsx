import { cn } from '@uandi/ui/lib/utils';

export const FEEDBACK_RESPONSE_NOTICE_IMAGE = '/brand/emoticons/1-12-thinking.png';

export type FeedbackResponseNoticeProps = {
  /** 이모티콘 이미지 경로. 기본은 생각하는 말랑 */
  imageSrc?: string;
  className?: string;
};

/**
 * 의견 보내기 하단 안내 — 말랑 부부가 맞벌이라 답장·처리는 대체로 주말에 한다는 것을 미리 알린다.
 * 폼 아래에 두어 "보냈는데 왜 답이 없지"를 줄이는 용도(docs/pages/07-feedback.md 「화면」).
 */
export function FeedbackResponseNotice({
  imageSrc = FEEDBACK_RESPONSE_NOTICE_IMAGE,
  className,
}: FeedbackResponseNoticeProps) {
  return (
    <aside
      aria-label="답장 시점 안내"
      data-testid="feedback-response-notice"
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-secondary/60 p-4',
        className
      )}
    >
      <img
        src={imageSrc}
        alt="생각하는 말랑"
        width={64}
        height={64}
        draggable={false}
        className="size-16 shrink-0 select-none object-contain"
      />
      <div className="min-w-0 space-y-1 break-keep">
        <p className="text-sm font-semibold text-foreground">답장은 주말에 드려요</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          말랑 부부는 평일엔 각자 회사에 다니는 맞벌이예요. 문의 답변과 건의·버그 처리는 대체로
          주말에 하고 있어요. 조금 늦더라도 하나하나 읽고 답장할게요.
        </p>
      </div>
    </aside>
  );
}
