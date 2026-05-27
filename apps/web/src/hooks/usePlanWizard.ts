import { useMemo } from 'react';
import { REGULAR_SUBGROUPS, WIZARD_GROUP_ORDER, type WizardGroup } from '@/constants/plan-wizard';
import { SUB_GROUPS_BY_GROUP } from '@uandi/cashbook-core';
import type { AnnualPlanItem, CashbookCategory } from '@/types';

export type WizardPhase = 'avg' | 'grid';

export type WizardStep =
  | { kind: 'intro' }
  | {
      kind: 'category';
      group: WizardGroup;
      catIdx: number;
      phase: WizardPhase;
      item: AnnualPlanItem;
      category: CashbookCategory;
    }
  | { kind: 'validate' }
  | { kind: 'summary' };

export type WizardParams = {
  step: string | null;
  group?: string | null;
  catIdx?: number | null;
  phase?: string | null;
};

export type UsePlanWizardResult = {
  steps: WizardStep[];
  current: WizardStep;
  next: WizardStep | null;
  prev: WizardStep | null;
  /** intro=0, summary=1 */
  progress: number;
  currentStepIndex: number;
  itemsByGroup: Record<WizardGroup, AnnualPlanItem[]>;
  /** 주어진 step을 URL 쿼리 문자열(prefix '?')로 변환 */
  urlFor: (step: WizardStep) => string;
};

function sortItemsForWizard(
  items: AnnualPlanItem[],
  categoriesById: Map<string, CashbookCategory>
): AnnualPlanItem[] {
  return [...items].sort((a, b) => {
    const ca = categoriesById.get(a.categoryId);
    const cb = categoriesById.get(b.categoryId);
    const subOrderA = SUB_GROUPS_BY_GROUP[a.group].indexOf(a.subGroup);
    const subOrderB = SUB_GROUPS_BY_GROUP[b.group].indexOf(b.subGroup);
    if (subOrderA !== subOrderB) return subOrderA - subOrderB;
    const so = (ca?.sortOrder ?? 0) - (cb?.sortOrder ?? 0);
    if (so !== 0) return so;
    return (ca?.name ?? '').localeCompare(cb?.name ?? '');
  });
}

function isWizardGroup(v: unknown): v is WizardGroup {
  return v === 'income' || v === 'expense' || v === 'flex';
}

export function usePlanWizard(
  items: AnnualPlanItem[] | undefined,
  categories: CashbookCategory[] | undefined,
  params: WizardParams
): UsePlanWizardResult {
  return useMemo(() => {
    const safeItems = items ?? [];
    const safeCategories = categories ?? [];
    const categoriesById = new Map(safeCategories.map((c) => [c.id, c]));

    const itemsByGroup: Record<WizardGroup, AnnualPlanItem[]> = {
      income: [],
      expense: [],
      flex: [],
    };
    for (const group of WIZARD_GROUP_ORDER) {
      itemsByGroup[group] = sortItemsForWizard(
        safeItems.filter((it) => it.group === group && categoriesById.has(it.categoryId)),
        categoriesById
      );
    }

    const steps: WizardStep[] = [{ kind: 'intro' }];
    for (const group of WIZARD_GROUP_ORDER) {
      itemsByGroup[group].forEach((item, catIdx) => {
        const category = categoriesById.get(item.categoryId)!;
        const isRegular = REGULAR_SUBGROUPS.has(item.subGroup);
        if (isRegular) {
          steps.push({ kind: 'category', group, catIdx, phase: 'avg', item, category });
          steps.push({ kind: 'category', group, catIdx, phase: 'grid', item, category });
        } else {
          steps.push({ kind: 'category', group, catIdx, phase: 'grid', item, category });
        }
      });
    }
    steps.push({ kind: 'validate' });
    steps.push({ kind: 'summary' });

    const currentStepIndex = findStepIndex(steps, params);
    const current = steps[currentStepIndex] ?? steps[0];
    const next = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null;
    const prev = currentStepIndex > 0 ? steps[currentStepIndex - 1] : null;
    const progress = steps.length <= 1 ? 1 : currentStepIndex / (steps.length - 1);

    return {
      steps,
      current,
      next,
      prev,
      progress,
      currentStepIndex,
      itemsByGroup,
      urlFor: stepToQuery,
    };
  }, [items, categories, params]);
}

function findStepIndex(steps: WizardStep[], params: WizardParams): number {
  const step = params.step ?? 'intro';
  if (step === 'intro') return 0;
  if (step === 'validate') {
    const idx = steps.findIndex((s) => s.kind === 'validate');
    return idx >= 0 ? idx : 0;
  }
  if (step === 'summary') {
    const idx = steps.findIndex((s) => s.kind === 'summary');
    return idx >= 0 ? idx : 0;
  }
  if (!isWizardGroup(step)) return 0;
  const catIdx = params.catIdx ?? 0;
  const phase: WizardPhase = params.phase === 'avg' ? 'avg' : 'grid';
  // exact match
  const exact = steps.findIndex(
    (s) => s.kind === 'category' && s.group === step && s.catIdx === catIdx && s.phase === phase
  );
  if (exact >= 0) return exact;
  // 비정기 카테고리에 phase=avg 가 들어와도 grid 로 매칭
  const fallback = steps.findIndex(
    (s) => s.kind === 'category' && s.group === step && s.catIdx === catIdx
  );
  return fallback >= 0 ? fallback : 0;
}

function stepToQuery(step: WizardStep): string {
  if (step.kind === 'intro') return '?step=intro';
  if (step.kind === 'validate') return '?step=validate';
  if (step.kind === 'summary') return '?step=summary';
  return `?step=${step.group}&catIdx=${step.catIdx}&phase=${step.phase}`;
}
