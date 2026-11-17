'use client';

import { ChevronRight, ClipboardCheck, Flag } from 'lucide-react';
import { SUB_GROUP_LABELS } from '@uandi/cashbook-core';
import { Button, cn, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@uandi/ui';
import { CategoryIcon } from '@/components/cashbook/CategoryIcon';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import { avgValueOf } from './PlanWizardCategoryStep';

export type WizardStepSheetRow = {
  item: AnnualPlanItem;
  category: CashbookCategory;
  /** 평균 입력 화면을 쓰는 항목(정기 항목, 빠른 모드의 모든 항목)이면 true → 항상 월 금액으로 보여준다 */
  usesAvg: boolean;
};

/** 위치 선택 시트에서 고를 수 있는 목적지 */
export type WizardJumpTarget =
  | { kind: 'item'; itemId: string }
  | { kind: 'validate' }
  | { kind: 'summary' };

/** 지금 있는 위치. 인트로에서는 시트를 열지 않는다. */
export type WizardStepSheetCurrent =
  | { kind: 'item'; itemId: string }
  | { kind: 'validate' }
  | { kind: 'summary' };

type PlanWizardStepSheetProps = {
  /** 위저드 순서대로 정렬된 항목. 같은 subGroup끼리 연속해 있어야 한다(섹션으로 묶는다). */
  rows: WizardStepSheetRow[];
  current: WizardStepSheetCurrent;
  /** 검증(수입 ≥ 지출) 통과 여부. 통과 못 했으면 "완료" 행이 안내 문구를 보여준다. */
  validationOk: boolean;
  onSelect: (target: WizardJumpTarget) => void;
};

/** 행 오른쪽 금액. 12개월이 같거나 평균 입력 항목이면 "월 …", 달마다 다르면 "연 …", 0원이면 null */
export function stepRowAmountLabel(
  row: Pick<WizardStepSheetRow, 'item' | 'usesAvg'>
): string | null {
  const months = row.item.monthlyAmounts ?? [];
  const annual = months.reduce((s, v) => s + v, 0);
  if (annual === 0) return null;
  const flat = months.length > 0 && months.every((v) => v === months[0]);
  if (row.usesAvg || flat) return `월 ${formatCurrencyMan(avgValueOf(row.item))}원`;
  return `연 ${formatCurrencyMan(annual)}원`;
}

type Section = { key: string; label: string; rows: WizardStepSheetRow[] };

function toSections(rows: WizardStepSheetRow[]): Section[] {
  const sections: Section[] = [];
  for (const row of rows) {
    const last = sections[sections.length - 1];
    if (last && last.key === row.item.subGroup) {
      last.rows.push(row);
    } else {
      sections.push({
        key: row.item.subGroup,
        label: SUB_GROUP_LABELS[row.item.subGroup],
        rows: [row],
      });
    }
  }
  return sections;
}

/** 현재 행이 시트 안에서 보이도록 스크롤 */
function scrollIntoViewRef(el: HTMLElement | null) {
  el?.scrollIntoView({ block: 'center' });
}

export function PlanWizardStepSheet({
  rows,
  current,
  validationOk,
  onSelect,
}: PlanWizardStepSheetProps) {
  const sections = toSections(rows);
  const isCurrentItem = (itemId: string) => current.kind === 'item' && current.itemId === itemId;

  return (
    <SheetContent
      side="bottom"
      className="flex max-h-[90vh] flex-col rounded-t-[20px]"
      data-testid="wizard-step-sheet"
    >
      <SheetHeader>
        <SheetTitle>위치 선택</SheetTitle>
        <SheetDescription>적던 금액은 저장하고 바로 이동해요</SheetDescription>
      </SheetHeader>

      <div className="-mx-1 flex-1 overflow-y-auto px-1 pb-[calc(1rem+var(--safe-bottom))]">
        {sections.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">적을 항목이 없어요</p>
        ) : null}

        {sections.map((section) => (
          <section key={section.key} className="pt-3">
            <h3 className="px-2 pb-1 text-[12px] font-medium text-stone-500">{section.label}</h3>
            <ul>
              {section.rows.map((row) => {
                const active = isCurrentItem(row.item.id);
                const amount = stepRowAmountLabel(row);
                return (
                  <li key={row.item.id}>
                    <StepRow
                      testId="wizard-step-row"
                      active={active}
                      onClick={() => onSelect({ kind: 'item', itemId: row.item.id })}
                      icon={
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${row.category.color}1A` }}
                        >
                          <CategoryIcon
                            name={row.category.icon}
                            size={16}
                            color={row.category.color}
                          />
                        </span>
                      }
                      title={row.category.name}
                      trailing={
                        <span
                          className={cn(
                            'shrink-0 text-[13px] tabular-nums',
                            amount ? 'font-medium text-stone-700' : 'text-stone-400'
                          )}
                        >
                          {amount ?? '—'}
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className="mt-3 border-t border-stone-200 pt-2">
          <StepRow
            testId="wizard-step-validate"
            active={current.kind === 'validate'}
            onClick={() => onSelect({ kind: 'validate' })}
            icon={<PlainIcon icon={<ClipboardCheck size={16} />} />}
            title="예산 검증"
            subtitle="수입 ≥ 지출"
          />
          <StepRow
            testId="wizard-step-summary"
            active={current.kind === 'summary'}
            onClick={() => onSelect({ kind: 'summary' })}
            icon={<PlainIcon icon={<Flag size={16} />} />}
            title="완료"
            subtitle={validationOk ? '예산 요약을 보고 저장해요' : '검증을 먼저 통과해야 해요'}
          />
        </div>
      </div>
    </SheetContent>
  );
}

function PlainIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
      {icon}
    </span>
  );
}

function StepRow({
  testId,
  active,
  onClick,
  icon,
  title,
  subtitle,
  trailing,
}: {
  testId: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      ref={active ? scrollIntoViewRef : undefined}
      onClick={onClick}
      aria-current={active ? 'step' : undefined}
      data-testid={testId}
      className={cn(
        'h-auto w-full justify-start gap-3 whitespace-normal rounded-xl px-2 py-2.5 text-left font-normal',
        active ? 'bg-coral-50 hover:bg-coral-50' : 'hover:bg-stone-50'
      )}
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[14px]',
            active ? 'font-semibold text-coral-700' : 'text-stone-800'
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="block truncate text-[12px] text-stone-500">{subtitle}</span>
        ) : null}
      </span>
      {trailing}
      {active ? (
        <span className="shrink-0 text-[11px] font-medium text-coral-600">지금 여기</span>
      ) : (
        <ChevronRight size={16} className="shrink-0 text-stone-300" />
      )}
    </Button>
  );
}
