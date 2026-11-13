'use client';

import { useCategoryLabels, type CategoryLabels } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { userAtom } from '@/stores/auth.store';
import { MascotLoader } from '@/components/MascotLoader';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  useAnnualPlan,
  useAnnualPlanItems,
  useAnnualPlanRevisions,
  useCreateAnnualPlan,
  useUpdatePlanItemAmount,
  useValidateAnnualPlan,
  useBulkUpdatePlanItems,
} from '@/hooks/useAnnualPlan';
import { usePlanWizard, type UsePlanWizardResult, type WizardStep } from '@/hooks/usePlanWizard';
import {
  totalsFromItems,
  ensurePlanItems,
  deleteAnnualPlanIfUntouched,
  updateAnnualPlanWizardProgress,
} from '@/services/annual-plan';
import { WIZARD_ENTRY_PARAM, parseWizardEntry, withWizardEntry } from '@/lib/plan-wizard-entry';
import {
  DEFAULT_WIZARD_MODE,
  REGULAR_SUBGROUPS,
  isWizardMode,
  type WizardMode,
} from '@/constants/plan-wizard';
import { PlanWizardShell } from '@/components/cashbook/plan-wizard/PlanWizardShell';
import { PlanWizardIntro } from '@/components/cashbook/plan-wizard/PlanWizardIntro';
import {
  PlanWizardCategoryStep,
  avgValueOf,
} from '@/components/cashbook/plan-wizard/PlanWizardCategoryStep';
import { PlanWizardValidate } from '@/components/cashbook/plan-wizard/PlanWizardValidate';
import { PlanWizardSummary } from '@/components/cashbook/plan-wizard/PlanWizardSummary';
import type { AnnualPlanItem } from '@/types';

type Draft = {
  monthlyAmounts: number[];
  baseMonthlyAmount: number | null;
  inputMode: 'regular' | 'irregular';
};

const WIZARD_PATH = '/inner/cashbook/plan/annual/wizard';
const PLAN_PATH = '/inner/cashbook/plan/annual';

export default function AnnualPlanWizardPage() {
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <WizardPageInner />
    </Suspense>
  );
}

function WizardPageInner() {
  const router = useRouter();
  const t = useTranslations('cashbook.wizard.page');
  const labels = useCategoryLabels();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const catIdxParam = searchParams.get('catIdx');
  const phaseParam = searchParams.get('phase');
  const modeParam = searchParams.get('mode');
  // 대시보드 권유 카드에서 열렸으면 모든 단계·도착 페이지에 표식을 넘긴다(경제 목표의 "홈으로")
  const entry = parseWizardEntry(searchParams.get(WIZARD_ENTRY_PARAM));
  // 인트로 밖의 단계에서 mode가 없으면 full(이전 URL 호환). 인트로에서는 아래 introMode가 결정한다.
  const mode: WizardMode = isWizardMode(modeParam) ? modeParam : 'full';

  const params = {
    step: stepParam,
    catIdx: catIdxParam ? Number(catIdxParam) : 0,
    phase: phaseParam,
    mode,
  };

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { data: categories, isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(coupleId, plan?.id ?? null);
  const { data: revisions } = useAnnualPlanRevisions(coupleId, plan?.id ?? null);

  const createPlanMutation = useCreateAnnualPlan(coupleId);
  const updateMutation = useUpdatePlanItemAmount(coupleId, plan?.id ?? null);
  const finalizeMutation = useBulkUpdatePlanItems(coupleId, plan?.id ?? null);
  const qc = useQueryClient();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  // 인트로에서 고르는 모드. 이어서 하기로 돌아온 플랜이면 그때 고른 모드를 기본으로.
  const [introMode, setIntroMode] = useState<WizardMode | null>(null);

  // 1) plan 자동 생성
  const planCreatedRef = useRef(false);
  useEffect(() => {
    if (!planPending && !plan && coupleId && !planCreatedRef.current) {
      planCreatedRef.current = true;
      createPlanMutation.mutate({ year, createdBy: uid });
    }
  }, [planPending, plan, coupleId, year, uid, createPlanMutation]);

  // 2) plan + categories 가 준비되면 누락된 item 자동 생성 + 깨진 item 치유
  const itemsInitRef = useRef(false);
  useEffect(() => {
    if (!plan || !categories || !items || itemsPending) return;
    if (itemsInitRef.current) return;
    itemsInitRef.current = true;
    ensurePlanItems(coupleId!, plan.id, categories, items).then((changed) => {
      if (changed) qc.invalidateQueries({ queryKey: ['annualPlanItems', coupleId, plan.id] });
    });
  }, [plan, categories, items, itemsPending, coupleId, qc]);

  const itemsWithDrafts = applyDrafts(items, drafts);
  const wizard = usePlanWizard(itemsWithDrafts, categories, params);
  // 인트로의 모드 선택용 — 두 모드의 단계 목록과 항목 수
  const quickWizard = usePlanWizard(itemsWithDrafts, categories, { step: 'intro', mode: 'quick' });
  const fullWizard = usePlanWizard(itemsWithDrafts, categories, { step: 'intro', mode: 'full' });
  const validation = useValidateAnnualPlan(itemsWithDrafts);

  // step 누락 시 intro 로 정규화
  useEffect(() => {
    if (!stepParam) router.replace(withWizardEntry(`${WIZARD_PATH}?step=intro`, entry));
  }, [stepParam, router, entry]);

  const selectedIntroMode: WizardMode =
    introMode ?? (isWizardMode(plan?.wizardMode) ? plan.wizardMode : DEFAULT_WIZARD_MODE);

  const invalidatePlan = () => qc.invalidateQueries({ queryKey: ['annualPlan', coupleId] });

  /** 미완 위저드의 마지막 단계를 플랜에 기록한다(이어서 하기). 실패해도 진행은 막지 않는다. */
  const persistProgress = (query: string | null, nextMode: WizardMode | null) => {
    if (!plan || !coupleId) return;
    updateAnnualPlanWizardProgress(coupleId, plan.id, {
      wizardLastStep: query,
      wizardMode: nextMode,
    }).catch(() => {});
  };

  const navigateTo = (step: WizardStep, w: UsePlanWizardResult = wizard) => {
    const query = w.urlFor(step);
    if (step.kind !== 'intro') persistProgress(query, w.mode);
    router.push(withWizardEntry(`${WIZARD_PATH}${query}`, entry));
  };

  const commitCurrentDraftIfDirty = async () => {
    if (wizard.current.kind !== 'category') return;
    const itemId = wizard.current.item.id;
    const draft = drafts[itemId];
    if (!draft) return;
    await updateMutation.mutateAsync({
      itemId,
      data: {
        monthlyAmounts: draft.monthlyAmounts,
        inputMode: draft.inputMode,
        baseMonthlyAmount: draft.baseMonthlyAmount,
      },
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  /** 정기 항목의 평균이 0원이면 그리드 단계는 건너뛴다(full 모드). */
  const isZeroGridStep = (step: WizardStep | null | undefined): step is WizardStep =>
    !!step && step.kind === 'category' && step.phase === 'grid' && avgValueOf(step.item) === 0;

  const handlePrev = async () => {
    if (!wizard.prev) return;
    await commitCurrentDraftIfDirty();
    const idx = wizard.currentStepIndex;
    const prev = wizard.prev;
    const beforePrev = wizard.steps[idx - 2];
    if (
      isZeroGridStep(prev) &&
      beforePrev?.kind === 'category' &&
      prev.kind === 'category' &&
      beforePrev.item.id === prev.item.id
    ) {
      navigateTo(beforePrev);
      return;
    }
    navigateTo(prev);
  };

  const handleExit = async () => {
    await commitCurrentDraftIfDirty();
    // 아무것도 입력하지 않았으면(인트로에서 바로 나감 등) 빈 플랜을 남기지 않고 대시보드로
    if (plan) {
      const deleted = await deleteAnnualPlanIfUntouched(coupleId!, plan.id);
      if (deleted) {
        await Promise.all([
          invalidatePlan(),
          qc.invalidateQueries({ queryKey: ['annualPlanItems', coupleId] }),
        ]);
        router.replace('/inner/cashbook');
        return;
      }
    }
    await invalidatePlan();
    router.push(withWizardEntry(PLAN_PATH, entry));
  };

  const handleFinish = async () => {
    if (!plan || !items || !itemsWithDrafts) return;
    await commitCurrentDraftIfDirty();

    const lastRev = (revisions ?? [])[0];
    const isInitial = !lastRev;
    const before: Record<string, number[]> = {};
    const after: Record<string, number[]> = {};
    for (const it of itemsWithDrafts) {
      before[it.id] = lastRev?.after?.[it.id] ?? Array(12).fill(0);
      after[it.id] = it.monthlyAmounts;
    }
    const beforeItems = itemsWithDrafts.map((it) => ({
      ...it,
      monthlyAmounts: before[it.id],
      annualAmount: before[it.id].reduce((s, v) => s + v, 0),
    }));
    const totalsBefore = totalsFromItems(beforeItems);
    const totalsAfter = totalsFromItems(itemsWithDrafts);

    await finalizeMutation.mutateAsync({
      updates: [],
      revision: {
        planId: plan.id,
        coupleId: coupleId!,
        source: isInitial ? 'wizard_initial' : 'wizard_redo',
        createdBy: uid,
        before,
        after,
        totals: { before: totalsBefore, after: totalsAfter },
      },
    });
    // 완료 — 이어서 하기 표식을 지운다
    await updateAnnualPlanWizardProgress(coupleId!, plan.id, {
      wizardLastStep: null,
      wizardMode: null,
    }).catch(() => {});
    await invalidatePlan();
    toast.success(isInitial ? t('completed') : t('redone'));
    router.replace(withWizardEntry(PLAN_PATH, entry));
  };

  const handleNext = async () => {
    if (wizard.current.kind === 'intro') {
      // 고른 모드의 첫 단계로. 모드는 URL 쿼리로 따라다닌다.
      const w = selectedIntroMode === 'quick' ? quickWizard : fullWizard;
      const first = w.steps[1];
      if (first) navigateTo(first, w);
      return;
    }
    if (wizard.current.kind === 'validate' && !validation.ok) return;
    if (wizard.current.kind === 'summary') {
      await handleFinish();
      return;
    }
    await commitCurrentDraftIfDirty();
    const idx = wizard.currentStepIndex;
    const next = wizard.next;
    if (!next) return;
    // 평균 0원 → 같은 항목의 그리드 단계는 건너뛴다
    if (
      wizard.current.kind === 'category' &&
      wizard.current.phase === 'avg' &&
      isZeroGridStep(next) &&
      next.kind === 'category' &&
      next.item.id === wizard.current.item.id
    ) {
      const afterGrid = wizard.steps[idx + 2];
      if (afterGrid) navigateTo(afterGrid);
      return;
    }
    navigateTo(next);
  };

  /** 이 항목은 건너뛰기 — 0원으로 저장하고 다음 항목의 첫 화면으로 */
  const handleSkip = async () => {
    if (wizard.current.kind !== 'category') return;
    const item = wizard.current.item;
    const isRegular = REGULAR_SUBGROUPS.has(item.subGroup);
    await updateMutation.mutateAsync({
      itemId: item.id,
      data: {
        monthlyAmounts: Array(12).fill(0),
        inputMode: isRegular ? 'regular' : 'irregular',
        baseMonthlyAmount: isRegular ? 0 : null,
      },
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    const nextStep = wizard.steps
      .slice(wizard.currentStepIndex + 1)
      .find((s) => s.kind !== 'category' || s.item.id !== item.id);
    if (nextStep) navigateTo(nextStep);
  };

  const handleChangeAvg = (value: number) => {
    if (wizard.current.kind !== 'category') return;
    const item = wizard.current.item;
    const isRegular = REGULAR_SUBGROUPS.has(item.subGroup);
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        monthlyAmounts: Array(12).fill(value),
        // 빠른 모드의 변동 항목은 평균으로 12개월을 채우되 비정기 입력으로 남긴다
        baseMonthlyAmount: isRegular ? value : null,
        inputMode: isRegular ? 'regular' : 'irregular',
      },
    }));
  };

  const handleChangeMonthly = (values: number[]) => {
    if (wizard.current.kind !== 'category') return;
    const item = wizard.current.item;
    const isRegular = REGULAR_SUBGROUPS.has(item.subGroup);
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        monthlyAmounts: values,
        baseMonthlyAmount: isRegular ? item.baseMonthlyAmount : null,
        inputMode: isRegular ? 'regular' : 'irregular',
      },
    }));
  };

  const isLoading =
    planPending ||
    catPending ||
    !plan ||
    !categories ||
    !items ||
    itemsPending ||
    (categories.length > 0 && items.length === 0) ||
    items.some((it) => !Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12);

  if (isLoading) return <MascotLoader fullScreen />;

  const rendered = renderStep({
    t,
    labels,
    current: wizard.current,
    wizard,
    validation,
    year,
    counts: {
      quick: {
        income: quickWizard.itemsByGroup.income.length,
        expense: quickWizard.itemsByGroup.expense.length,
      },
      full: {
        income: fullWizard.itemsByGroup.income.length,
        expense: fullWizard.itemsByGroup.expense.length,
      },
    },
    introMode: selectedIntroMode,
    onIntroModeChange: setIntroMode,
    items: itemsWithDrafts ?? [],
    onChangeAvg: handleChangeAvg,
    onChangeMonthly: handleChangeMonthly,
    saving: finalizeMutation.isPending,
  });

  return (
    <PlanWizardShell
      title={rendered.title}
      subtitle={rendered.subtitle}
      progress={wizard.progress}
      onPrev={wizard.prev ? handlePrev : undefined}
      onNext={handleNext}
      onExit={handleExit}
      onSkip={wizard.current.kind === 'category' ? handleSkip : undefined}
      prevDisabled={!wizard.prev}
      nextDisabled={rendered.nextDisabled}
      nextLabel={rendered.nextLabel}
    >
      {rendered.body}
    </PlanWizardShell>
  );
}

function applyDrafts(
  items: AnnualPlanItem[] | undefined,
  drafts: Record<string, Draft>
): AnnualPlanItem[] | undefined {
  if (!items) return undefined;
  return items.map((it) => {
    const d = drafts[it.id];
    if (!d) return it;
    return {
      ...it,
      monthlyAmounts: d.monthlyAmounts,
      baseMonthlyAmount: d.baseMonthlyAmount,
      inputMode: d.inputMode,
      annualAmount: d.monthlyAmounts.reduce((s, v) => s + v, 0),
    };
  });
}

type RenderStepArgs = {
  t: ReturnType<typeof useTranslations<'cashbook.wizard.page'>>;
  labels: CategoryLabels;
  current: WizardStep;
  wizard: UsePlanWizardResult;
  validation: ReturnType<typeof useValidateAnnualPlan>;
  year: number;
  counts: Record<WizardMode, { income: number; expense: number }>;
  introMode: WizardMode;
  onIntroModeChange: (mode: WizardMode) => void;
  items: AnnualPlanItem[];
  onChangeAvg: (value: number) => void;
  onChangeMonthly: (values: number[]) => void;
  saving: boolean;
};

function renderStep({
  current,
  wizard,
  validation,
  year,
  counts,
  introMode,
  onIntroModeChange,
  items,
  onChangeAvg,
  onChangeMonthly,
  saving,
  t,
  labels,
}: RenderStepArgs): {
  title: string;
  subtitle?: string;
  nextLabel: string;
  nextDisabled: boolean;
  body: React.ReactNode;
} {
  if (current.kind === 'intro') {
    return {
      title: t('titleIntro', { year }),
      subtitle: t('start'),
      nextLabel: t('start'),
      nextDisabled: false,
      body: (
        <PlanWizardIntro
          year={year}
          counts={counts}
          mode={introMode}
          onModeChange={onIntroModeChange}
        />
      ),
    };
  }

  if (current.kind === 'category') {
    const groupLabel = labels.group(current.group);
    const total = wizard.itemsByGroup[current.group].length;
    const phaseLabel =
      current.phase === 'avg'
        ? t('phaseAvg')
        : REGULAR_SUBGROUPS.has(current.item.subGroup)
          ? t('phaseAdjust')
          : t('phaseInput');
    return {
      title: current.category.name,
      subtitle: t('subtitle', {
        group: groupLabel,
        index: current.catIdx + 1,
        total,
        phase: phaseLabel,
      }),
      nextLabel: t('next'),
      nextDisabled: false,
      body: (
        <PlanWizardCategoryStep
          category={current.category}
          item={current.item}
          phase={current.phase}
          mode={wizard.mode}
          onChangeAvg={onChangeAvg}
          onChangeMonthly={onChangeMonthly}
        />
      ),
    };
  }

  if (current.kind === 'validate') {
    return {
      title: t('validateTitle'),
      subtitle: t('validateSubtitle'),
      nextLabel: t('next'),
      nextDisabled: !validation.ok,
      body: <PlanWizardValidate validation={validation} />,
    };
  }

  // summary
  return {
    title: t('doneTitle'),
    subtitle: t('doneSubtitle', { year }),
    nextLabel: saving ? t('saving') : t('done'),
    nextDisabled: saving,
    body: <PlanWizardSummary year={year} items={items} saving={saving} />,
  };
}
