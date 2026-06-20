'use client';

import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { Sparkles, BookOpen } from 'lucide-react';
import { Sheet, Button } from '@uandi/ui';
import { authStatusAtom, userAtom } from '@/stores/auth.store';
import { MascotLoader } from '@/components/MascotLoader';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useAddEntry, useAddEntries } from '@/hooks/useCashbook';
import { AiParseInput } from '@/components/cashbook/AiParseInput';
import { AiBulkPreviewSheet } from '@/components/cashbook/AiBulkPreviewSheet';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { parseEntriesFromText } from '@/services/ai';
import type { CashbookEntryType } from '@/types';

/**
 * 모바일 플로팅 버블(다른 앱 위 오버레이) 안의 WebView가 로드하는 전용 빠른 추가 페이지.
 * 메인 앱 chrome(하단탭/대시보드) 없이 빠른 추가 흐름만 단독으로 렌더한다.
 * 인증 세션은 WebView 간 쿠키/IndexedDB 공유로 메인 앱에서 그대로 이어진다.
 */
export default function OverlayQuickAddPage() {
  const status = useAtomValue(authStatusAtom);
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const { data: categories } = useCashbookCategories(coupleId);
  const addMutation = useAddEntry(coupleId);
  const addManyMutation = useAddEntries(coupleId);

  if (status === 'loading') {
    return <MascotLoader fullScreen />;
  }

  if (status !== 'authenticated_with_couple') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <Sparkles className="text-primary" size={28} />
        <p className="text-sm font-medium">MOA에 로그인하면 빠른 추가를 쓸 수 있어요</p>
        <p className="text-xs text-muted-foreground">앱에서 로그인한 뒤 다시 시도해주세요</p>
      </main>
    );
  }

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
    <main className="flex min-h-screen flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h1 className="text-base font-semibold">빠른 추가</h1>
      </div>

      <AiParseInput
        categories={(categories ?? []).map((c) => c.name)}
        parseFn={parseEntriesFromText}
        textareaClassName="focus-visible:ring-inset focus-visible:ring-offset-0"
        onEmptySubmit={openManualForm}
        onParsed={(results) => {
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
                fullScreen
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

      <p className="mt-3 text-xs text-muted-foreground">
        자연어로 입력하거나 영수증 사진을 첨부하면 AI가 내역을 정리해드려요.
      </p>

      {/* 하단: MOA 앱을 열어 전체 내역 페이지로 이동(오버레이 WebView가 uandi:// 스킴을 가로챈다). */}
      <Button
        variant="outline"
        className="mt-auto w-full"
        onClick={() => {
          window.location.href = 'uandi://inner/cashbook/history';
        }}
      >
        <BookOpen size={16} />
        앱에서 내역 보기
      </Button>
    </main>
  );
}
