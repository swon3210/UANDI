'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType } from '@/types';
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
  images?: string[]
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
  const addAttachment = useAddSettlementAttachment(coupleId);

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
        <AiParseInput
          categories={categories.map((c) => c.name)}
          parseFn={parseFn}
          // 스크롤 시트 안에서 포커스 링이 잘리지 않도록 inset 링 사용
          textareaClassName="focus-visible:ring-inset focus-visible:ring-offset-0"
          onImagePersist={({ file }) => {
            if (coupleId) addAttachment.mutate({ year, month, file });
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
