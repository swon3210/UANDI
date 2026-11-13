'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button, Header, Sheet } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useAddEntries } from '@/hooks/useCashbook';
import { DEFAULT_CATEGORIES, COLOR_PRESETS } from '@/constants/default-categories';
import { addCategory, initDefaultCategories } from '@/services/cashbook-categories';
import { parseEntriesWithSuggestions, type SuggestedCategory } from '@/services/ai';
import { normalizeCategoryName } from '@/lib/ai/parse-entries-core';
import { MascotLoader } from '@/components/MascotLoader';
import { BackButton } from '@/components/shell/BackButton';
import { AiParseInput } from '@/components/cashbook/AiParseInput';
import { AiBulkPreviewSheet, type ConfirmedEntry } from '@/components/cashbook/AiBulkPreviewSheet';
import { ImportSourcePicker } from '@/components/cashbook/ImportSourcePicker';
import { ImportStepIndicator } from '@/components/cashbook/ImportStepIndicator';
import {
  SuggestedCategoryList,
  suggestedCategoryColor,
} from '@/components/cashbook/SuggestedCategoryList';
import type {
  ImportSource,
  SuggestedCategoryDraft,
  UsedCategoryCount,
} from '@/components/cashbook/import-types';
import type { CashbookCategory, CashbookEntryType } from '@/types';

type ImportStep = 'upload' | 'categories' | 'entries';

type ParsedRow = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

/** 제안을 뺐을 때 내역이 가는 곳. 기본 목록에 없으므로 필요할 때 만든다. */
const FALLBACK_CATEGORY = {
  group: 'expense' as const,
  subGroup: 'variable_common' as const,
  icon: 'tag',
};

const DASHBOARD = '/inner/cashbook';

/** 저장한 내역이 가장 많은 달의 대시보드 경로. 이번 달이면 쿼리 없이. */
function dashboardPathForEntries(entries: ConfirmedEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = dayjs(e.date.toDate()).format('YYYY-MM');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  for (const [key, count] of counts) {
    if (best === null || count > (counts.get(best) ?? 0)) best = key;
  }
  if (!best || best === dayjs().format('YYYY-MM')) return DASHBOARD;
  return `${DASHBOARD}?at=${best}-01`;
}

function ImportPageContent() {
  const t = useTranslations('cashbook.import');
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOnboarding = searchParams.get('onboarding') === '1';
  const queryClient = useQueryClient();

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';
  const { data: categories, isPending: categoriesPending } = useCashbookCategories(coupleId);
  const addEntriesMutation = useAddEntries(coupleId, 'import');

  const [source, setSource] = useState<ImportSource>('card');
  const [step, setStep] = useState<ImportStep>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [drafts, setDrafts] = useState<SuggestedCategoryDraft[]>([]);
  const [usedCategories, setUsedCategories] = useState<UsedCategoryCount[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  // AiParseInput의 parseFn은 entries 배열만 돌려주므로 제안은 ref로 받아 둔다
  const suggestionsRef = useRef<SuggestedCategory[]>([]);

  if (!coupleId || categoriesPending) return <MascotLoader fullScreen />;

  const existing = categories ?? [];
  // 파싱 후보 = 기본 카테고리 + 이미 있는 커플 카테고리 (이름 기준 합집합)
  const candidateNames = Array.from(
    new Set([...DEFAULT_CATEGORIES.map((c) => c.name), ...existing.map((c) => c.name)])
  );
  const stepNumber = step === 'upload' ? 1 : step === 'categories' ? 2 : 3;

  const goDashboard = () => router.replace(DASHBOARD);

  // ── 1단계: 파싱 결과 → 제안 초안·쓰인 카테고리 집계 ──
  const handleParsed = (results: ParsedRow[]) => {
    const suggestions = suggestionsRef.current;
    const suggestionKeys = new Set(suggestions.map((s) => normalizeCategoryName(s.name)));
    const counts = new Map<string, number>();
    for (const r of results) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);

    setRows(results);
    setDrafts(
      suggestions.map((s) => ({
        originalName: s.name,
        name: s.name,
        group: s.group,
        subGroup: s.subGroup,
        icon: s.icon,
        entryCount: counts.get(s.name) ?? 0,
        included: true,
      }))
    );
    setUsedCategories(
      Array.from(counts.entries())
        .filter(([name]) => !suggestionKeys.has(normalizeCategoryName(name)))
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    );
    setErrors({});
    setStep('categories');
  };

  // ── 2단계: 이름 검증 후 3단계 미리보기 열기 ──
  const validateDrafts = (): boolean => {
    const next: Record<number, string> = {};
    const taken = new Set(existing.map((c) => normalizeCategoryName(c.name)));
    for (const name of DEFAULT_CATEGORIES.map((c) => c.name))
      taken.add(normalizeCategoryName(name));
    const seen = new Set<string>();
    drafts.forEach((d, i) => {
      if (!d.included) return;
      const key = normalizeCategoryName(d.name);
      if (!key) next[i] = t('nameRequired');
      else if (taken.has(key) || seen.has(key)) next[i] = t('duplicate');
      seen.add(key);
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** 제안 확정 결과를 내역에 반영한다(이름 변경·빼기 → 기타). */
  const applyDraftsToRows = (): ParsedRow[] => {
    const byOriginal = new Map(drafts.map((d) => [normalizeCategoryName(d.originalName), d]));
    return rows.map((r) => {
      const d = byOriginal.get(normalizeCategoryName(r.category));
      if (!d) return r;
      return { ...r, category: d.included ? d.name.trim() : t('fallbackCategory') };
    });
  };

  // ── 3단계 확정: 카테고리 준비 → 내역 저장 → 대시보드 ──
  const handleConfirm = async (confirmed: ConfirmedEntry[], closePreview: () => void) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // (1) 구버전 커플(카테고리 0개) 보조 가드
      if (existing.length === 0) await initDefaultCategories(coupleId);

      // (2) 확정한 새 카테고리 + 필요하면 '기타'
      const included = drafts.filter((d) => d.included);
      const needsFallback =
        confirmed.some((e) => e.category === t('fallbackCategory')) &&
        !existing.some(
          (c) => normalizeCategoryName(c.name) === normalizeCategoryName(t('fallbackCategory'))
        );
      const toCreate: Omit<CashbookCategory, 'id' | 'coupleId' | 'createdAt'>[] = included.map(
        (d, i) => ({
          group: d.group,
          subGroup: d.subGroup,
          name: d.name.trim(),
          icon: d.icon,
          color: suggestedCategoryColor(i),
          isDefault: false,
          sortOrder: 100 + i,
          parentCategoryId: null,
          description: '',
          examples: [],
        })
      );
      if (needsFallback) {
        toCreate.push({
          ...FALLBACK_CATEGORY,
          name: t('fallbackCategory'),
          color: COLOR_PRESETS[COLOR_PRESETS.length - 1],
          isDefault: false,
          sortOrder: 999,
          parentCategoryId: null,
          description: t('fallbackDescription'),
          examples: [],
        });
      }
      for (const data of toCreate) await addCategory(coupleId, data);
      await queryClient.invalidateQueries({ queryKey: ['cashbookCategories', coupleId] });

      // (3) 내역 일괄 저장 (성공 토스트는 훅이 띄운다) → 내역이 가장 많은 달로
      await addEntriesMutation.mutateAsync(confirmed);
      closePreview();
      router.replace(dashboardPathForEntries(confirmed));
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const openPreview = () => {
    const initialEntries = applyDraftsToRows();
    setStep('entries');
    overlay.open(({ isOpen, close, unmount }) => {
      const dismiss = () => {
        close();
        setTimeout(unmount, 300);
      };
      return (
        <Sheet
          open={isOpen}
          onOpenChange={(open) => {
            if (open) return;
            dismiss();
            setStep('categories');
          }}
        >
          <AiBulkPreviewSheet
            initialEntries={initialEntries}
            categories={existing}
            coupleId={coupleId}
            createdBy={uid}
            fullScreen
            onConfirm={(confirmed) => void handleConfirm(confirmed, dismiss)}
            onClose={() => {
              dismiss();
              setStep('categories');
            }}
          />
        </Sheet>
      );
    });
  };

  const handleNext = () => {
    if (!validateDrafts()) return;
    openPreview();
  };

  const leftSlot = fromOnboarding ? (
    <button
      type="button"
      onClick={goDashboard}
      data-testid="import-skip"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {t('skip')}
    </button>
  ) : (
    <BackButton fallbackHref={DASHBOARD} />
  );

  return (
    <>
      <Header title={t('title')} leftSlot={leftSlot} />
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-3">
        {/* 모바일 폭에서 헤더 제목과 겹치지 않도록 단계 표시는 본문 상단에 둔다 */}
        <ImportStepIndicator current={stepNumber} className="mb-4 justify-end" />
        {step === 'upload' ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold leading-snug">{t('uploadTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t('uploadDescription')}
              </p>
            </div>
            <ImportSourcePicker value={source} onChange={setSource} />
            <AiParseInput
              categories={candidateNames}
              parseFn={async (text, names, images, pdfs) => {
                const result = await parseEntriesWithSuggestions(text, names, images, {
                  imageKind: source,
                  pdfs,
                  allowNewCategories: true,
                });
                suggestionsRef.current = result.suggestedCategories;
                return result.entries;
              }}
              onParsed={(results) =>
                handleParsed(
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
            <p className="text-xs leading-relaxed text-muted-foreground">{t('uploadHint')}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold leading-snug">{t('categoriesTitle')}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t('categoriesDescription', {
                  entries: rows.length,
                  categories: usedCategories.length + drafts.length,
                  defaults: DEFAULT_CATEGORIES.length,
                })}
              </p>
            </div>
            <SuggestedCategoryList
              drafts={drafts}
              usedCategories={usedCategories}
              errors={errors}
              onChange={(i, next) => {
                setDrafts((prev) => prev.map((d, j) => (j === i ? next : d)));
                if (errors[i]) setErrors((prev) => ({ ...prev, [i]: '' }));
              }}
            />
            <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
              <div className="mx-auto flex max-w-md gap-2">
                <Button variant="outline" onClick={() => setStep('upload')} disabled={isSaving}>
                  {t('reupload')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={isSaving}
                  data-testid="import-next"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                  {t('review')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/** 지난 내역 가져오기 — docs/pages/inner/cashbook-import.md. 쿼리(onboarding)를 읽으므로 Suspense 경계가 필요하다. */
export default function CashbookImportPage() {
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <ImportPageContent />
    </Suspense>
  );
}
