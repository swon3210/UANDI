'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { FullScreenSpinner } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
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
import { usePlanWizard, type WizardStep } from '@/hooks/usePlanWizard';
import { totalsFromItems, upsertPlanItem } from '@/services/annual-plan';
import { REGULAR_SUBGROUPS, WIZARD_GROUP_LABEL } from '@/constants/plan-wizard';
import { PlanWizardShell } from '@/components/cashbook/plan-wizard/PlanWizardShell';
import { PlanWizardIntro } from '@/components/cashbook/plan-wizard/PlanWizardIntro';
import { PlanWizardCategoryStep } from '@/components/cashbook/plan-wizard/PlanWizardCategoryStep';
import { PlanWizardValidate } from '@/components/cashbook/plan-wizard/PlanWizardValidate';
import { PlanWizardSummary } from '@/components/cashbook/plan-wizard/PlanWizardSummary';
import type { AnnualPlanItem } from '@/types';

type Draft = {
  monthlyAmounts: number[];
  baseMonthlyAmount: number | null;
  inputMode: 'regular' | 'irregular';
};

const WIZARD_PATH = '/cashbook/plan/annual/wizard';

export default function AnnualPlanWizardPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <WizardPageInner />
    </Suspense>
  );
}

function WizardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const catIdxParam = searchParams.get('catIdx');
  const phaseParam = searchParams.get('phase');

  const params = {
    step: stepParam,
    catIdx: catIdxParam ? Number(catIdxParam) : 0,
    phase: phaseParam,
  };

  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';
  const year = dayjs().year();

  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const { data: categories, isPending: catPending } = useCashbookCategories(coupleId);
  const { data: items, isPending: itemsPending } = useAnnualPlanItems(
    coupleId,
    plan?.id ?? null
  );
  const { data: revisions } = useAnnualPlanRevisions(coupleId, plan?.id ?? null);

  const createPlanMutation = useCreateAnnualPlan(coupleId);
  const updateMutation = useUpdatePlanItemAmount(coupleId, plan?.id ?? null);
  const finalizeMutation = useBulkUpdatePlanItems(coupleId, plan?.id ?? null);
  const qc = useQueryClient();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

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
    const categoriesById = new Map(categories.map((c) => [c.id, c]));
    const existing = new Set(items.map((i) => i.categoryId));
    const missing = categories.filter((c) => !existing.has(c.id));
    const broken = items.filter(
      (it) =>
        categoriesById.has(it.categoryId) &&
        (!Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12)
    );
    if (missing.length === 0 && broken.length === 0) return;
    itemsInitRef.current = true;
    Promise.all([
      ...missing.map((cat) => {
        const itemId = `item-${plan.id}-${cat.id}`;
        return upsertPlanItem(coupleId!, plan.id, itemId, {
          planId: plan.id,
          coupleId: coupleId!,
          categoryId: cat.id,
          group: cat.group,
          subGroup: cat.subGroup,
          monthlyAmounts: Array(12).fill(0),
          inputMode: 'irregular',
          baseMonthlyAmount: null,
          annualAmount: 0,
          ownerUid: null,
          updatedAt: Timestamp.now(),
        });
      }),
      ...broken.map((it) => {
        const cat = categoriesById.get(it.categoryId)!;
        return upsertPlanItem(coupleId!, plan.id, it.id, {
          planId: plan.id,
          coupleId: coupleId!,
          categoryId: it.categoryId,
          group: it.group ?? cat.group,
          subGroup: it.subGroup ?? cat.subGroup,
          monthlyAmounts: Array(12).fill(0),
          inputMode: it.inputMode ?? 'irregular',
          baseMonthlyAmount:
            typeof it.baseMonthlyAmount === 'number' ? it.baseMonthlyAmount : null,
          annualAmount: 0,
          ownerUid: it.ownerUid ?? null,
          updatedAt: Timestamp.now(),
        });
      }),
    ]).then(() => {
      qc.invalidateQueries({ queryKey: ['annualPlanItems', coupleId, plan.id] });
    });
  }, [plan, categories, items, itemsPending, coupleId, qc]);

  const itemsWithDrafts = applyDrafts(items, drafts);
  const wizard = usePlanWizard(itemsWithDrafts, categories, params);
  const validation = useValidateAnnualPlan(itemsWithDrafts);

  // step 누락 시 intro 로 정규화
  useEffect(() => {
    if (!stepParam) router.replace(`${WIZARD_PATH}?step=intro`);
  }, [stepParam, router]);

  const navigateTo = (step: WizardStep) => {
    router.push(`${WIZARD_PATH}${wizard.urlFor(step)}`);
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

  const handlePrev = async () => {
    if (!wizard.prev) return;
    await commitCurrentDraftIfDirty();
    navigateTo(wizard.prev);
  };

  const handleExit = async () => {
    await commitCurrentDraftIfDirty();
    router.push('/cashbook/plan/annual');
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
    toast.success(isInitial ? '예산 계획을 완성했어요!' : '예산을 다시 세웠어요');
    router.replace('/cashbook/plan/annual');
  };

  const handleNext = async () => {
    if (wizard.current.kind === 'validate' && !validation.ok) return;
    if (wizard.current.kind === 'summary') {
      await handleFinish();
      return;
    }
    await commitCurrentDraftIfDirty();
    if (wizard.next) navigateTo(wizard.next);
  };

  const handleChangeAvg = (value: number) => {
    if (wizard.current.kind !== 'category') return;
    const item = wizard.current.item;
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        monthlyAmounts: Array(12).fill(value),
        baseMonthlyAmount: value,
        inputMode: 'regular',
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
    items.some(
      (it) => !Array.isArray(it.monthlyAmounts) || it.monthlyAmounts.length !== 12
    );

  if (isLoading) return <FullScreenSpinner />;

  const counts = {
    income: wizard.itemsByGroup.income.length,
    expense: wizard.itemsByGroup.expense.length,
    flex: wizard.itemsByGroup.flex.length,
  };

  const rendered = renderStep({
    current: wizard.current,
    wizard,
    validation,
    year,
    counts,
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
  current: WizardStep;
  wizard: ReturnType<typeof usePlanWizard>;
  validation: ReturnType<typeof useValidateAnnualPlan>;
  year: number;
  counts: { income: number; expense: number; flex: number };
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
  items,
  onChangeAvg,
  onChangeMonthly,
  saving,
}: RenderStepArgs): {
  title: string;
  subtitle?: string;
  nextLabel: string;
  nextDisabled: boolean;
  body: React.ReactNode;
} {
  if (current.kind === 'intro') {
    return {
      title: `${year}년 연간 예산`,
      subtitle: '시작하기',
      nextLabel: '시작하기',
      nextDisabled: false,
      body: (
        <PlanWizardIntro
          year={year}
          incomeCount={counts.income}
          expenseCount={counts.expense}
          flexCount={counts.flex}
        />
      ),
    };
  }

  if (current.kind === 'category') {
    const groupLabel = WIZARD_GROUP_LABEL[current.group];
    const total = wizard.itemsByGroup[current.group].length;
    const phaseLabel = REGULAR_SUBGROUPS.has(current.item.subGroup)
      ? current.phase === 'avg'
        ? '평균'
        : '월별 조정'
      : '월별 입력';
    return {
      title: current.category.name,
      subtitle: `${groupLabel} · ${current.catIdx + 1} / ${total} · ${phaseLabel}`,
      nextLabel: '다음',
      nextDisabled: false,
      body: (
        <PlanWizardCategoryStep
          category={current.category}
          item={current.item}
          phase={current.phase}
          onChangeAvg={onChangeAvg}
          onChangeMonthly={onChangeMonthly}
        />
      ),
    };
  }

  if (current.kind === 'validate') {
    return {
      title: '예산 검증',
      subtitle: '수입 ≥ 지출 + Flex',
      nextLabel: '다음',
      nextDisabled: !validation.ok,
      body: <PlanWizardValidate validation={validation} />,
    };
  }

  // summary
  return {
    title: '완료',
    subtitle: `${year}년 예산 요약`,
    nextLabel: saving ? '저장 중...' : '완료',
    nextDisabled: saving,
    body: <PlanWizardSummary year={year} items={items} saving={saving} />,
  };
}
