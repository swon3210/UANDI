'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useAddEntry, useAddEntries } from '@/hooks/useCashbook';
import { AiParseInput } from '@/components/cashbook/AiParseInput';
import { AiBulkPreviewSheet } from '@/components/cashbook/AiBulkPreviewSheet';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { parseEntriesFromText } from '@/services/ai';
import type { CashbookEntryType } from '@/types';

/**
 * 빠른 추가 시트 내용. overlay-kit으로 매번 새로 마운트되므로 훅을 직접 구독해
 * 카테고리/뮤테이션을 최신 상태로 사용한다(이벤트 핸들러의 stale closure 회피).
 * history 페이지의 AI 추가 흐름(AiParseInput → AiBulkPreviewSheet)을 그대로 재사용한다.
 */
function QuickAddSheetContent({ onClose }: { onClose: () => void }) {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const { data: categories } = useCashbookCategories(coupleId);
  const addMutation = useAddEntry(coupleId);
  const addManyMutation = useAddEntries(coupleId);

  // 빈 입력으로 제출하면 직접 입력 폼을 연다(history 페이지와 동일한 UX).
  const openManualForm = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <EntryForm
          categories={categories ?? []}
          coupleId={coupleId}
          createdBy={uid}
          onSubmit={(data) => addMutation.mutate(data)}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="quick-add-sheet"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          빠른 추가
        </SheetTitle>
      </SheetHeader>

      <div className="py-4">
        <AiParseInput
          categories={(categories ?? []).map((c) => c.name)}
          parseFn={parseEntriesFromText}
          textareaClassName="focus-visible:ring-inset focus-visible:ring-offset-0"
          onEmptySubmit={openManualForm}
          onParsed={(results) => {
            // 파싱이 끝나면 입력 시트를 닫고 결과 확인 시트를 연다.
            onClose();
            const initialEntries = results.map((r) => ({
              type: r.type as CashbookEntryType,
              amount: r.amount,
              category: r.category,
              description: r.description,
              date: r.date,
              confidence: r.confidence,
            }));
            overlay.open(({ isOpen, close, unmount }) => (
              <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
                <AiBulkPreviewSheet
                  initialEntries={initialEntries}
                  categories={categories ?? []}
                  coupleId={coupleId}
                  createdBy={uid}
                  onConfirm={(confirmed) => addManyMutation.mutate(confirmed)}
                  onClose={() => {
                    close();
                    setTimeout(unmount, 300);
                  }}
                />
              </Sheet>
            ));
          }}
        />
      </div>
    </SheetContent>
  );
}

/**
 * WebView를 감싼 모바일 native FAB이 window.dispatchEvent(new Event('uandi:quick-add'))를
 * 주입하면, 현재 어느 페이지에 있든 가계부 빠른 추가 시트를 오버레이로 띄운다.
 * native bridge(__UANDI_NATIVE__)와 동일하게 인증된 웹 컨텍스트에서 기존 로직을 재사용한다.
 */
export function QuickAddBridge(): null {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const openRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      if (!coupleId) {
        toast.info('로그인 후 이용할 수 있어요');
        return;
      }
      if (openRef.current) return;
      openRef.current = true;

      overlay.open(({ isOpen, close, unmount }) => (
        <Sheet
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) {
              openRef.current = false;
              close();
            }
          }}
        >
          <QuickAddSheetContent
            onClose={() => {
              openRef.current = false;
              close();
              setTimeout(unmount, 300);
            }}
          />
        </Sheet>
      ));
    };

    window.addEventListener('uandi:quick-add', handler);
    return () => window.removeEventListener('uandi:quick-add', handler);
  }, [coupleId]);

  return null;
}
