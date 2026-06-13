'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  Button,
  cn,
  Input,
  Label,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import type { CashbookCategory } from '@/types';
import {
  createDefaultFilterState,
  type CashbookFilterState,
  type EntryFilterType,
  type PeriodPreset,
  type PeriodSelection,
} from '@/hooks/useCashbook';
import { resolvePeriod } from '@/utils/date';
import { getVisibleCategories, TYPE_LABELS, TYPE_ORDER } from './entry-filter.utils';
import { CategoryIcon } from './CategoryIcon';

type CashbookFilterSheetProps = {
  categories: CashbookCategory[];
  initial: CashbookFilterState;
  onApply: (next: CashbookFilterState) => void;
  onClose: () => void;
};

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'thisMonth', label: '이번 달' },
  { value: 'lastMonth', label: '지난달' },
  { value: 'last3Months', label: '최근 3개월' },
  { value: 'thisYear', label: '올해' },
  { value: 'custom', label: '직접 선택' },
];

/** 현재 기간 상태에 대응하는 프리셋 버튼을 찾는다(스테퍼로 이동한 임의의 달이면 null). */
function getActivePreset(period: PeriodSelection): PeriodPreset | null {
  if (period.mode === 'last3Months') return 'last3Months';
  if (period.mode === 'thisYear') return 'thisYear';
  if (period.mode === 'custom') return 'custom';
  const now = dayjs();
  if (period.year === now.year() && period.month === now.month()) return 'thisMonth';
  const last = now.subtract(1, 'month');
  if (period.year === last.year() && period.month === last.month()) return 'lastMonth';
  return null;
}

export function CashbookFilterSheet({
  categories,
  initial,
  onApply,
  onClose,
}: CashbookFilterSheetProps) {
  const [draft, setDraft] = useState<CashbookFilterState>(initial);
  const [categoryOpen, setCategoryOpen] = useState(initial.selectedCategoryNames.length > 0);

  const custom = draft.period.mode === 'custom' ? draft.period : null;
  const customIncomplete = !!custom && (!custom.start || !custom.end);
  const customInvalid = !!custom && !!custom.start && !!custom.end && custom.end < custom.start;
  const applyDisabled = customIncomplete || customInvalid;

  const activePreset = getActivePreset(draft.period);
  const periodLabel = resolvePeriod(draft.period).label;
  const visibleCategories = getVisibleCategories(categories, draft.typeFilter);

  const handlePresetClick = (preset: PeriodPreset) => {
    const now = dayjs();
    let period: PeriodSelection;
    if (preset === 'thisMonth') {
      period = { mode: 'month', year: now.year(), month: now.month() };
    } else if (preset === 'lastMonth') {
      const last = now.subtract(1, 'month');
      period = { mode: 'month', year: last.year(), month: last.month() };
    } else if (preset === 'last3Months') {
      period = { mode: 'last3Months' };
    } else if (preset === 'thisYear') {
      period = { mode: 'thisYear' };
    } else {
      const r = resolvePeriod(draft.period);
      period = {
        mode: 'custom',
        start: dayjs(r.start).format('YYYY-MM-DD'),
        end: dayjs(r.end).format('YYYY-MM-DD'),
      };
    }
    setDraft((d) => ({ ...d, period }));
  };

  const updateCustom = (patch: Partial<{ start: string; end: string }>) => {
    setDraft((d) => {
      const cur =
        d.period.mode === 'custom' ? d.period : { mode: 'custom' as const, start: '', end: '' };
      return { ...d, period: { ...cur, ...patch } };
    });
  };

  const handleTypeChange = (type: EntryFilterType) => {
    setDraft((d) => ({ ...d, typeFilter: type, selectedCategoryNames: [] }));
  };

  const toggleCategory = (name: string) => {
    setDraft((d) => ({
      ...d,
      selectedCategoryNames: d.selectedCategoryNames.includes(name)
        ? d.selectedCategoryNames.filter((n) => n !== name)
        : [...d.selectedCategoryNames, name],
    }));
  };

  const handleReset = () => {
    setDraft(createDefaultFilterState());
    setCategoryOpen(false);
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <SheetContent
      side="bottom"
      className="flex max-h-[90vh] flex-col rounded-t-[20px]"
      data-testid="cashbook-filter-sheet"
    >
      <SheetHeader>
        <SheetTitle>필터</SheetTitle>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-1 py-4">
        {/* 키워드 */}
        <div className="space-y-2">
          <Label>키워드</Label>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              value={draft.keyword}
              onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
              placeholder="메모·카테고리 검색"
              aria-label="키워드 검색"
              data-testid="filter-keyword-input"
              className="pl-9"
            />
          </div>
        </div>

        {/* 기간 */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label>기간</Label>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map(({ value, label }) => {
              const selected = activePreset === value;
              return (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  aria-pressed={selected}
                  data-testid={`filter-period-${value}`}
                  onClick={() => handlePresetClick(value)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          {custom && (
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="date"
                value={custom.start}
                onChange={(e) => updateCustom({ start: e.target.value })}
                aria-label="시작일"
                data-testid="filter-period-start"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={custom.end}
                onChange={(e) => updateCustom({ end: e.target.value })}
                aria-label="종료일"
                data-testid="filter-period-end"
              />
            </div>
          )}
          {customInvalid && (
            <p className="text-xs text-destructive">종료일이 시작일보다 빠를 수 없어요</p>
          )}
        </div>

        {/* 타입 */}
        <div className="space-y-2">
          <Label>타입</Label>
          <Tabs value={draft.typeFilter} onValueChange={(v) => handleTypeChange(v as EntryFilterType)}>
            <TabsList className="w-full">
              {TYPE_ORDER.map((t) => (
                <TabsTrigger key={t} value={t} data-testid={`filter-type-${t}`} className="flex-1">
                  {TYPE_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* 카테고리 */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              data-testid="filter-category-trigger"
              onClick={() => setCategoryOpen((o) => !o)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-sm font-medium">카테고리</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {draft.selectedCategoryNames.length > 0
                  ? `${draft.selectedCategoryNames.length}개 선택`
                  : '전체'}
                <ChevronDown
                  size={16}
                  className={'transition-transform ' + (categoryOpen ? 'rotate-180' : '')}
                />
              </span>
            </button>
            {categoryOpen && (
              <div className="max-h-48 overflow-y-auto rounded-lg border p-1">
                {visibleCategories.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-muted-foreground">
                    해당 타입의 카테고리가 없어요
                  </p>
                ) : (
                  visibleCategories.map((category) => {
                    const checked = draft.selectedCategoryNames.includes(category.name);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        data-testid={`filter-category-option-${category.name}`}
                        aria-pressed={checked}
                        onClick={() => toggleCategory(category.name)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            checked
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input'
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: category.color + '20', color: category.color }}
                        >
                          <CategoryIcon name={category.icon} size={12} />
                        </span>
                        <span className="text-sm">{category.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t pt-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          data-testid="filter-reset"
          onClick={handleReset}
        >
          초기화
        </Button>
        <Button
          type="button"
          className="flex-1"
          data-testid="filter-apply"
          onClick={handleApply}
          disabled={applyDisabled}
        >
          적용
        </Button>
      </div>
    </SheetContent>
  );
}
