'use client';

import { Loader2, X, ImageIcon, Landmark, CreditCard, Plus } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { SettlementAttachment, SettlementImageKind } from '@/types';

export type SettlementAttachmentGalleryProps = {
  attachments: SettlementAttachment[];
  onRemove: (attachment: SettlementAttachment) => void;
  /** 분류별 "이미지 추가" 버튼을 노출하려면 전달. 누른 분류(계좌/카드)가 콜백된다. */
  onAdd?: (kind: SettlementImageKind) => void;
  /** 삭제 진행 중인 첨부 id (스피너 표시용) */
  removingId?: string | null;
};

// 첨부에 분류가 없으면(구버전 데이터) 계좌로 취급한다.
function kindOf(att: SettlementAttachment): SettlementImageKind {
  return att.kind === 'card' ? 'card' : 'account';
}

type IndexedAttachment = { att: SettlementAttachment; index: number };

type SectionConfig = {
  key: SettlementImageKind;
  label: string;
  icon: typeof Landmark;
};

const SECTIONS: SectionConfig[] = [
  { key: 'account', label: '계좌 내역', icon: Landmark },
  { key: 'card', label: '카드 내역', icon: CreditCard },
];

/**
 * 결산 작업 중 첨부한 영수증·스크린샷 갤러리.
 * 계좌 내역 / 카드 내역으로 분리해 노출한다.
 * onAdd가 전달되면 각 목록에 "이미지 추가" 버튼을 노출하고, 빈 목록도 항상 보여준다.
 * 첨부는 Firestore + Storage에 유지돼 결산 완료 전까지 새로고침에도 남는다.
 */
export function SettlementAttachmentGallery({
  attachments,
  onRemove,
  onAdd,
  removingId,
}: SettlementAttachmentGalleryProps) {
  // 전역 인덱스를 유지해 분류와 무관하게 썸네일 testid가 안정적이도록 한다.
  const indexed: IndexedAttachment[] = attachments.map((att, index) => ({ att, index }));

  return (
    <div data-testid="settlement-attachment-gallery">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <ImageIcon size={13} />
        첨부한 영수증·스크린샷 ({attachments.length})
      </p>

      {attachments.length === 0 && !onAdd ? (
        <p
          className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground"
          data-testid="settlement-attachment-empty"
        >
          아직 첨부한 이미지가 없어요. 결산을 완료하면 첨부 이미지는 삭제돼요.
        </p>
      ) : (
        <div className="space-y-3">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const items = indexed.filter(({ att }) => kindOf(att) === key);
            // 읽기 전용(onAdd 없음)일 땐 비어 있는 목록은 숨긴다.
            if (items.length === 0 && !onAdd) return null;
            return (
              <div key={key} data-testid={`settlement-attachment-section-${key}`}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Icon size={12} />
                    {label} ({items.length})
                  </p>
                  {onAdd && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-testid={`settlement-attachment-add-${key}`}
                      className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
                      onClick={() => onAdd(key)}
                    >
                      <Plus size={13} />
                      이미지 추가
                    </Button>
                  )}
                </div>

                {items.length === 0 ? (
                  <p
                    className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-[11px] text-muted-foreground"
                    data-testid={`settlement-attachment-empty-${key}`}
                  >
                    아직 첨부한 {label} 이미지가 없어요.
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {items.map(({ att, index }) => {
                      const isRemoving = removingId === att.id;
                      return (
                        <div
                          key={att.id}
                          data-testid={`settlement-attachment-${index}`}
                          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={att.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            data-testid={`settlement-attachment-remove-${index}`}
                            aria-label={`${att.name} 제거`}
                            onClick={() => onRemove(att)}
                            disabled={isRemoving}
                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background disabled:opacity-60"
                          >
                            {isRemoving ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <X size={12} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
