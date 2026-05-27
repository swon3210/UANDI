'use client';

import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import {
  GROUP_LABELS,
  SUB_GROUP_LABELS,
  type CashbookCategory,
  type CategoryGroup,
  type CategorySubGroup,
} from '@uandi/cashbook-core';
import { cn } from '@uandi/ui';
import { CategoryIcon } from '@/components/cashbook/CategoryIcon';
import { MONTH_LABELS } from '@/constants/plan-wizard';
import { formatCurrencyMan } from '@/utils/currency';

export type BulkEditRow = {
  itemId: string;
  category: CashbookCategory;
  monthlyAmounts: number[];
  baseline: number[];
};

type BulkEditGridProps = {
  rows: BulkEditRow[];
  onChangeRow: (itemId: string, monthlyAmounts: number[]) => void;
  onResetRow: (itemId: string) => void;
};

type Section = {
  group: CategoryGroup;
  subSections: { subGroup: CategorySubGroup; rows: BulkEditRow[] }[];
};

const GROUP_TONE: Record<CategoryGroup, string> = {
  income: 'text-sage-700 bg-sage-50',
  expense: 'text-coral-700 bg-coral-50',
  flex: 'text-violet-700 bg-violet-50',
};

export function BulkEditGrid({ rows, onChangeRow, onResetRow }: BulkEditGridProps) {
  const sections = buildSections(rows);

  return (
    <div
      className="relative overflow-x-auto rounded-2xl border border-stone-200 bg-white"
      data-testid="bulk-edit-grid"
    >
      <table className="w-full border-separate border-spacing-0 text-[12px]">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 top-0 z-30 h-10 min-w-[160px] border-b border-r border-stone-200 bg-stone-50 px-3 text-left text-[11px] font-semibold text-stone-500"
            >
              카테고리
            </th>
            {MONTH_LABELS.map((label) => (
              <th
                key={label}
                scope="col"
                className="sticky top-0 z-20 h-10 min-w-[72px] border-b border-stone-200 bg-stone-50 px-1 text-center text-[11px] font-semibold text-stone-500"
              >
                {label}
              </th>
            ))}
            <th
              scope="col"
              className="sticky right-0 top-0 z-30 h-10 min-w-[112px] border-b border-l border-stone-200 bg-stone-50 px-2 text-right text-[11px] font-semibold text-stone-500"
            >
              변동
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <SectionBlock
              key={section.group}
              section={section}
              onChangeRow={onChangeRow}
              onResetRow={onResetRow}
            />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={14} className="px-4 py-10 text-center text-[12px] text-stone-400">
                수정할 카테고리가 없어요.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({
  section,
  onChangeRow,
  onResetRow,
}: {
  section: Section;
  onChangeRow: (itemId: string, monthlyAmounts: number[]) => void;
  onResetRow: (itemId: string) => void;
}) {
  return (
    <>
      <tr aria-hidden>
        <td colSpan={14} className="border-b border-stone-200 p-0">
          <div
            className={cn(
              'sticky left-0 z-10 inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold',
              GROUP_TONE[section.group]
            )}
          >
            {GROUP_LABELS[section.group]}
          </div>
        </td>
      </tr>
      {section.subSections.map((sub) => (
        <SubGroupBlock
          key={sub.subGroup}
          subGroup={sub.subGroup}
          rows={sub.rows}
          onChangeRow={onChangeRow}
          onResetRow={onResetRow}
        />
      ))}
    </>
  );
}

function SubGroupBlock({
  subGroup,
  rows,
  onChangeRow,
  onResetRow,
}: {
  subGroup: CategorySubGroup;
  rows: BulkEditRow[];
  onChangeRow: (itemId: string, monthlyAmounts: number[]) => void;
  onResetRow: (itemId: string) => void;
}) {
  return (
    <>
      <tr aria-hidden>
        <td colSpan={14} className="border-b border-stone-100 bg-stone-50/60 p-0">
          <div className="sticky left-0 z-10 inline-flex items-center px-3 py-1 text-[10.5px] font-medium uppercase tracking-wide text-stone-500">
            {SUB_GROUP_LABELS[subGroup]}
          </div>
        </td>
      </tr>
      {rows.map((row) => (
        <BulkEditRowView
          key={row.itemId}
          row={row}
          onChange={(values) => onChangeRow(row.itemId, values)}
          onReset={() => onResetRow(row.itemId)}
        />
      ))}
    </>
  );
}

function BulkEditRowView({
  row,
  onChange,
  onReset,
}: {
  row: BulkEditRow;
  onChange: (values: number[]) => void;
  onReset: () => void;
}) {
  const total = sum(row.monthlyAmounts);
  const baselineTotal = sum(row.baseline);
  const delta = total - baselineTotal;
  const dirty = delta !== 0 || row.monthlyAmounts.some((v, i) => v !== row.baseline[i]);

  return (
    <tr data-testid={`bulk-edit-row-${row.itemId}`} className="group">
      <th
        scope="row"
        className="sticky left-0 z-10 min-w-[160px] border-b border-r border-stone-200 bg-white px-3 py-2 text-left align-middle"
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${row.category.color}20` }}
          >
            <CategoryIcon
              name={row.category.icon}
              size={14}
              color={row.category.color}
              weight="fill"
            />
          </span>
          <span className="truncate text-[12px] font-semibold text-stone-800">
            {row.category.name}
          </span>
        </div>
      </th>
      {row.monthlyAmounts.map((value, idx) => {
        const baseValue = row.baseline[idx] ?? 0;
        const cellChanged = value !== baseValue;
        return (
          <BulkEditCell
            key={idx}
            value={value}
            changed={cellChanged}
            testId={`bulk-edit-cell-${row.itemId}-${idx + 1}`}
            onChange={(next) => {
              const arr = row.monthlyAmounts.slice();
              arr[idx] = next;
              onChange(arr);
            }}
          />
        );
      })}
      <td
        className={cn(
          'sticky right-0 z-10 min-w-[112px] border-b border-l border-stone-200 px-2 py-2 align-middle text-right tabular-nums',
          dirty ? 'bg-coral-50/40' : 'bg-white'
        )}
      >
        <div className="flex items-center justify-end gap-1.5">
          <span
            className={cn(
              'text-[12px] font-semibold',
              !dirty && 'text-stone-300',
              dirty && delta > 0 && 'text-coral-700',
              dirty && delta < 0 && 'text-sage-700',
              dirty && delta === 0 && 'text-stone-500'
            )}
            data-testid={`bulk-edit-row-delta-${row.itemId}`}
          >
            {dirty
              ? `${delta > 0 ? '+' : delta < 0 ? '-' : '±'}${formatCurrencyMan(Math.abs(delta))}`
              : '–'}
          </span>
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty}
            aria-label="이 행 되돌리기"
            data-testid={`bulk-edit-row-reset-${row.itemId}`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-30"
          >
            <Undo2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

type BulkEditCellProps = {
  value: number;
  changed: boolean;
  testId?: string;
  onChange: (next: number) => void;
};

function BulkEditCell({ value, changed, testId, onChange }: BulkEditCellProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const focused = draft !== null;
  const display = focused ? draft! : formatNumber(value);

  return (
    <td className="border-b border-stone-100 p-1 align-middle">
      <div
        className={cn(
          'flex h-9 min-w-[64px] items-center rounded-lg border px-1.5 transition-colors',
          changed
            ? 'border-coral-300 bg-coral-50/60'
            : 'border-transparent bg-stone-50/60 hover:border-stone-200'
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          value={display}
          data-testid={testId}
          onFocus={() => setDraft(value === 0 ? '' : String(value))}
          onBlur={() => setDraft(null)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '');
            setDraft(raw);
            const num = raw === '' ? 0 : Number(raw);
            if (Number.isFinite(num)) onChange(num);
          }}
          className="w-full bg-transparent text-right text-[13px] font-semibold tabular-nums text-stone-900 outline-none placeholder:text-stone-300"
          placeholder="0"
        />
      </div>
    </td>
  );
}

function buildSections(rows: BulkEditRow[]): Section[] {
  const order: CategoryGroup[] = ['income', 'expense', 'flex'];
  const map = new Map<CategoryGroup, Map<CategorySubGroup, BulkEditRow[]>>();
  for (const row of rows) {
    if (!map.has(row.category.group)) {
      map.set(row.category.group, new Map());
    }
    const sub = map.get(row.category.group)!;
    if (!sub.has(row.category.subGroup)) {
      sub.set(row.category.subGroup, []);
    }
    sub.get(row.category.subGroup)!.push(row);
  }
  return order
    .filter((group) => map.has(group))
    .map<Section>((group) => {
      const subMap = map.get(group)!;
      const subSections = Array.from(subMap.entries()).map(([subGroup, rows]) => ({
        subGroup,
        rows,
      }));
      return { group, subSections };
    });
}

function sum(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return n.toLocaleString('ko-KR');
}
