'use client';

import { useRef } from 'react';
import dayjs from 'dayjs';
import { Loader2, X, ImageIcon, Landmark, CreditCard, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { SettlementAttachment, SettlementImageKind } from '@/types';

export type SettlementAttachmentGalleryProps = {
  attachments: SettlementAttachment[];
  onRemove: (attachment: SettlementAttachment) => void;
  /**
   * 분류별 "이미지 추가"(첨부 전용) 버튼을 노출하려면 전달.
   * 선택한 파일들과 누른 분류(계좌/카드)가 콜백된다. 파싱은 하지 않고 업로드만 한다.
   */
  onAttach?: (kind: SettlementImageKind, files: File[]) => void;
  /** 업로드 진행 중인 분류 (버튼 스피너 표시용) */
  attachingKind?: SettlementImageKind | null;
  /** 삭제 진행 중인 첨부 id (스피너 표시용) */
  removingId?: string | null;
};

// 첨부에 분류가 없으면(구버전 데이터) 계좌로 취급한다.
function kindOf(att: SettlementAttachment): SettlementImageKind {
  return att.kind === 'card' ? 'card' : 'account';
}

// 정렬 키: 분석된 월이 있으면 가장 이른 월, 없으면 맨 뒤로.
function sortKey(att: SettlementAttachment): string {
  return att.detectedMonths?.[0] ?? '9999-99';
}

function monthChipLabel(month: string): string {
  const d = dayjs(`${month}-01`);
  return d.isValid() ? d.format('M월') : month;
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
 * 계좌 내역 / 카드 내역으로 분리해 노출하고, 각 섹션은 분석된 월 순으로 정렬한다.
 * onAttach가 전달되면 각 목록에 "이미지 추가"(첨부 전용) 버튼을 노출하고, 빈 목록도 항상 보여준다.
 * 첨부는 Firestore + Storage에 유지돼 결산 완료 전까지 새로고침에도 남는다.
 */
export function SettlementAttachmentGallery({
  attachments,
  onRemove,
  onAttach,
  attachingKind,
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

      {onAttach && (
        <p
          className="mb-2 flex items-start gap-1.5 rounded-lg bg-muted/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground"
          data-testid="settlement-attachment-privacy-notice"
        >
          <ShieldCheck size={13} className="mt-px shrink-0 text-primary" />
          <span>
            첨부한 카드·계좌 명세 이미지는 내역을 자동으로 읽어오기 위해 AI(OpenAI)로 전송돼요.
            <strong className="font-medium text-foreground"> 점검을 완료하면 즉시 삭제</strong>되며,
            자세한 처리 내용은 개인정보처리방침에서 확인할 수 있어요.
          </span>
        </p>
      )}

      {attachments.length === 0 && !onAttach ? (
        <p
          className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground"
          data-testid="settlement-attachment-empty"
        >
          아직 첨부한 이미지가 없어요. 점검을 완료하면 첨부 이미지는 삭제돼요.
        </p>
      ) : (
        <div className="space-y-3">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const items = indexed
              .filter(({ att }) => kindOf(att) === key)
              .sort((a, b) => sortKey(a.att).localeCompare(sortKey(b.att)));
            // 읽기 전용(onAttach 없음)일 땐 비어 있는 목록은 숨긴다.
            if (items.length === 0 && !onAttach) return null;
            return (
              <SettlementAttachmentSection
                key={key}
                sectionKey={key}
                label={label}
                Icon={Icon}
                items={items}
                onAttach={onAttach}
                attaching={attachingKind === key}
                removingId={removingId}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

type SectionProps = {
  sectionKey: SettlementImageKind;
  label: string;
  Icon: typeof Landmark;
  items: IndexedAttachment[];
  onAttach?: (kind: SettlementImageKind, files: File[]) => void;
  attaching: boolean;
  removingId?: string | null;
  onRemove: (attachment: SettlementAttachment) => void;
};

function SettlementAttachmentSection({
  sectionKey,
  label,
  Icon,
  items,
  onAttach,
  attaching,
  removingId,
  onRemove,
}: SectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length > 0) onAttach?.(sectionKey, files);
  };

  return (
    <div data-testid={`settlement-attachment-section-${sectionKey}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Icon size={12} />
          {label} ({items.length})
        </p>
        {onAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              data-testid={`settlement-attachment-file-input-${sectionKey}`}
              onChange={handleFiles}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid={`settlement-attachment-add-${sectionKey}`}
              className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
              disabled={attaching}
              onClick={() => fileInputRef.current?.click()}
            >
              {attaching ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              이미지 추가
            </Button>
          </>
        )}
      </div>

      {items.length === 0 ? (
        <p
          className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-[11px] text-muted-foreground"
          data-testid={`settlement-attachment-empty-${sectionKey}`}
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
                <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                {att.detectedMonths && att.detectedMonths.length > 0 && (
                  <div
                    className="absolute inset-x-0 bottom-0 flex flex-wrap gap-0.5 bg-black/50 px-1 py-0.5"
                    data-testid={`settlement-attachment-months-${index}`}
                  >
                    {att.detectedMonths.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-white/85 px-1 text-[9px] font-medium leading-tight text-foreground"
                      >
                        {monthChipLabel(m)}
                      </span>
                    ))}
                  </div>
                )}
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
