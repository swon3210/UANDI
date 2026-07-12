'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { overlay } from 'overlay-kit';
import { ChevronRight, Search, Tag, X } from 'lucide-react';
import {
  Button,
  cn,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType } from '@/types';
import {
  createDefaultFilterState,
  type CashbookFilterState,
  type PeriodPreset,
  type PeriodSelection,
} from '@/hooks/useCashbook';
import { resolvePeriod } from '@/utils/date';
import { CategoryIcon } from './CategoryIcon';
import { CategoryFilterSheet } from './CategoryFilterSheet';
import { CreatorFilterChips, type FilterMember } from './CreatorFilterChips';
import { TypeFilterChips } from './TypeFilterChips';

type CashbookFilterSheetProps = {
  categories: CashbookCategory[];
  members: FilterMember[];
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
  members,
  initial,
  onApply,
  onClose,
}: CashbookFilterSheetProps) {
  const [draft, setDraft] = useState<CashbookFilterState>(initial);

  const custom = draft.period.mode === 'custom' ? draft.period : null;
  const customIncomplete = !!custom && (!custom.start || !custom.end);
  const customInvalid = !!custom && !!custom.start && !!custom.end && custom.end < custom.start;
  const applyDisabled = customIncomplete || customInvalid;

  const activePreset = getActivePreset(draft.period);
  const periodLabel = resolvePeriod(draft.period).label;
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

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

  const toggleType = (type: CashbookEntryType) => {
    setDraft((d) => ({
      ...d,
      selectedTypes: d.selectedTypes.includes(type)
        ? d.selectedTypes.filter((t) => t !== type)
        : [...d.selectedTypes, type],
    }));
  };

  const toggleCreator = (uid: string) => {
    setDraft((d) => ({
      ...d,
      selectedCreatorUids: d.selectedCreatorUids.includes(uid)
        ? d.selectedCreatorUids.filter((u) => u !== uid)
        : [...d.selectedCreatorUids, uid],
    }));
  };

  const removeCategory = (name: string) => {
    setDraft((d) => ({
      ...d,
      selectedCategoryNames: d.selectedCategoryNames.filter((n) => n !== name),
    }));
  };

  // 카테고리 다중선택 시트를 필터 시트 위에 중첩으로 연다(EntryForm의 서브시트 패턴과 동일).
  const openCategoryPicker = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CategoryFilterSheet
          categories={categories}
          initialSelected={draft.selectedCategoryNames}
          initialType={draft.selectedTypes[0] ?? 'expense'}
          onApply={(names) => setDraft((d) => ({ ...d, selectedCategoryNames: names }))}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleReset = () => {
    setDraft(createDefaultFilterState());
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

        {/* 타입 (다중 선택) */}
        <div className="space-y-2">
          <Label>타입</Label>
          <TypeFilterChips value={draft.selectedTypes} onToggle={toggleType} />
        </div>

        {/* 카테고리 (전용 시트에서 다중 선택) */}
        <div className="space-y-2">
          <Label>카테고리</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            data-testid="filter-category-picker-trigger"
            onClick={openCategoryPicker}
            disabled={categories.length === 0}
          >
            <span className="flex items-center gap-2">
              <Tag size={16} className="text-muted-foreground" />
              {draft.selectedCategoryNames.length > 0
                ? `${draft.selectedCategoryNames.length}개 선택`
                : '카테고리 선택'}
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Button>
          {draft.selectedCategoryNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.selectedCategoryNames.map((name) => {
                const cat = categoryByName.get(name);
                return (
                  <span
                    key={name}
                    data-testid={`filter-selected-category-${name}`}
                    className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 py-1 pl-2.5 pr-1 text-sm text-primary"
                  >
                    {cat && <CategoryIcon name={cat.icon} size={13} />}
                    {name}
                    <button
                      type="button"
                      aria-label={`${name} 제거`}
                      onClick={() => removeCategory(name)}
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full',
                        'transition-colors hover:bg-primary hover:text-primary-foreground'
                      )}
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 추가한 사람 (다중 선택, 커플 2인일 때만) */}
        {members.length >= 2 && (
          <div className="space-y-2">
            <Label>추가한 사람</Label>
            <CreatorFilterChips
              members={members}
              value={draft.selectedCreatorUids}
              onToggle={toggleCreator}
            />
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
