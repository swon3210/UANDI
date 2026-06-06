'use client';

import { Loader2, X, ImageIcon } from 'lucide-react';
import type { SettlementAttachment } from '@/types';

export type SettlementAttachmentGalleryProps = {
  attachments: SettlementAttachment[];
  onRemove: (attachment: SettlementAttachment) => void;
  /** 삭제 진행 중인 첨부 id (스피너 표시용) */
  removingId?: string | null;
};

/**
 * 결산 작업 중 첨부한 영수증·스크린샷 갤러리.
 * 첨부는 Firestore + Storage에 유지돼 결산 완료 전까지 새로고침에도 남는다.
 */
export function SettlementAttachmentGallery({
  attachments,
  onRemove,
  removingId,
}: SettlementAttachmentGalleryProps) {
  return (
    <div data-testid="settlement-attachment-gallery">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ImageIcon size={13} />
        첨부한 영수증·스크린샷 ({attachments.length})
      </p>

      {attachments.length === 0 ? (
        <p
          className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground"
          data-testid="settlement-attachment-empty"
        >
          아직 첨부한 이미지가 없어요. 결산을 완료하면 첨부 이미지는 삭제돼요.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto py-1">
          {attachments.map((att, index) => {
            const isRemoving = removingId === att.id;
            return (
              <div
                key={att.id}
                data-testid={`settlement-attachment-${index}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  data-testid={`settlement-attachment-remove-${index}`}
                  aria-label={`${att.name} 제거`}
                  onClick={() => onRemove(att)}
                  disabled={isRemoving}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background disabled:opacity-60"
                >
                  {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
