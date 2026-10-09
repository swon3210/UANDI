'use client';

import { FileText, X } from 'lucide-react';

export type AttachmentKind = 'image' | 'pdf';

type AttachmentThumbnailProps = {
  kind: AttachmentKind;
  name: string;
  /** image일 때 미리보기 src. pdf는 사용하지 않는다. */
  dataUrl?: string;
  /** pdf일 때 파일명 아래 보조 정보(예: "3페이지") */
  caption?: string;
  /** 테스트 id·접근성 라벨에 쓰는 순번 */
  index: number;
  onRemove: () => void;
};

/**
 * AI 파싱 입력의 첨부 1개 표시. 이미지는 정사각 썸네일, PDF는 아이콘 + 파일명 칩으로 보여준다.
 * 둘 다 우상단 X로 제거할 수 있다.
 */
export function AttachmentThumbnail({
  kind,
  name,
  dataUrl,
  caption,
  index,
  onRemove,
}: AttachmentThumbnailProps) {
  return (
    <div
      data-testid={`ai-parse-thumbnail-${index}`}
      data-kind={kind}
      className="relative h-16 shrink-0 overflow-hidden rounded-md border border-border"
    >
      {kind === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={name} className="h-full w-16 object-cover" />
      ) : (
        <div className="flex h-full w-28 flex-col items-center justify-center gap-1 bg-muted px-2 text-muted-foreground">
          <FileText size={20} />
          <span
            className="w-full truncate text-center text-[10px] leading-tight text-foreground"
            title={name}
          >
            {name}
          </span>
          {caption && <span className="text-[10px] leading-none">{caption}</span>}
        </div>
      )}
      <button
        type="button"
        data-testid={`ai-parse-thumbnail-remove-${index}`}
        aria-label={`${name} 제거`}
        onClick={onRemove}
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
      >
        <X size={12} />
      </button>
    </div>
  );
}
