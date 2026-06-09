'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SheetContent, SheetHeader, SheetTitle, Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType } from '@/types';
import type { ParseEntriesOptions } from '@/services/ai';
import { useAddSettlementAttachment } from '@/hooks/useSettlement';
import { AiParseInput } from './AiParseInput';
import {
  AiBulkPreviewSheet,
  type ConfirmedEntry,
  type InitialParsedEntry,
} from './AiBulkPreviewSheet';

type ParseFn = (
  text: string,
  categories: string[],
  images?: string[],
  options?: ParseEntriesOptions
) => Promise<
  {
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    confidence: number;
  }[]
>;

type ImageKind = 'account' | 'card';

type SettlementAddSheetProps = {
  categories: CashbookCategory[];
  coupleId: string | null;
  createdBy: string;
  year: number;
  month: number; // 1-indexed
  parseFn: ParseFn;
  onConfirm: (entries: ConfirmedEntry[]) => void;
  onClose: () => void;
};

/**
 * 월 결산의 통합 내역 추가 시트.
 * 1단계: 영수증·스크린샷 첨부(즉시 Storage 영속) + AI 파싱
 * 2단계: 내역 페이지와 동일한 중복 검사(AiBulkPreviewSheet)로 추가
 */
export function SettlementAddSheet({
  categories,
  coupleId,
  createdBy,
  year,
  month,
  parseFn,
  onConfirm,
  onClose,
}: SettlementAddSheetProps) {
  const [parsed, setParsed] = useState<InitialParsedEntry[] | null>(null);
  const [imageKind, setImageKind] = useState<ImageKind>('account');
  const addAttachment = useAddSettlementAttachment(coupleId);

  // 토글 분류와 카드 검증 경고를 주입해 AiParseInput에 넘긴다.
  // AiParseInput의 계약(3인자 호출 + 배열 반환)은 그대로 유지된다.
  const handleParse: ParseFn = (text, cats, images) =>
    parseFn(text, cats, images, {
      imageKind,
      onImageKindMismatch: () =>
        toast.warning('첨부한 이미지가 카드 내역이 아닌 것 같아요. 결과를 확인해 주세요.'),
    });

  if (parsed) {
    return (
      <AiBulkPreviewSheet
        initialEntries={parsed}
        categories={categories}
        coupleId={coupleId}
        createdBy={createdBy}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
  }

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="settlement-add-sheet"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Plus size={16} className="text-primary" />
          내역 추가
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          영수증 사진이나 카드·계좌 거래내역 스크린샷을 올리면 자동으로 내역을 추가해요. 텍스트로
          직접 입력할 수도 있어요. 첨부한 이미지는 결산을 완료할 때까지 보관돼요.
        </p>

        <div className="mb-3">
          <Tabs value={imageKind} onValueChange={(v) => setImageKind(v as ImageKind)}>
            <TabsList className="grid w-full grid-cols-2" data-testid="settlement-image-kind-toggle">
              <TabsTrigger value="account" data-testid="settlement-image-kind-account">
                계좌 내역
              </TabsTrigger>
              <TabsTrigger value="card" data-testid="settlement-image-kind-card">
                카드 내역
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {imageKind === 'account'
              ? '계좌(통장) 내역이에요. 카드대금처럼 한 번에 빠져나가는 출금은 카드 내역과 겹치지 않도록 제외돼요.'
              : '카드 사용 내역이에요. 카드 내역이 아닌 이미지를 올리면 알려드려요.'}
          </p>
        </div>

        <AiParseInput
          categories={categories.map((c) => c.name)}
          parseFn={handleParse}
          // 스크롤 시트 안에서 포커스 링이 잘리지 않도록 inset 링 사용
          textareaClassName="focus-visible:ring-inset focus-visible:ring-offset-0"
          onImagePersist={({ file }) => {
            if (coupleId) addAttachment.mutate({ year, month, file, kind: imageKind });
          }}
          onParsed={(results) =>
            setParsed(
              results.map((r) => ({
                type: r.type as CashbookEntryType,
                amount: r.amount,
                category: r.category,
                description: r.description,
                date: r.date,
                confidence: r.confidence,
              }))
            )
          }
        />
      </div>
    </SheetContent>
  );
}
