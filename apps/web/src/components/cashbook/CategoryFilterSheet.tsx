'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  Badge,
  Button,
  cn,
  Input,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import type {
  CashbookCategory,
  CashbookEntryType,
  CategoryGroup,
  CategorySubGroup,
} from '@/types';
import {
  GROUP_LABELS,
  SUB_GROUP_LABELS,
  SUB_GROUPS_BY_GROUP,
} from '@/constants/default-categories';
import { CategoryIcon } from './CategoryIcon';

const TAB_ORDER: CashbookEntryType[] = ['expense', 'income', 'flex'];
// 이 개수 이상일 때만 검색창을 노출(소수일 땐 드릴다운만으로 충분).
const SHOW_SEARCH_THRESHOLD = 8;

type CategoryFilterSheetProps = {
  categories: CashbookCategory[];
  /** 이미 선택된 카테고리 이름들. 시트는 이 값을 draft로 복제해 편집한다. */
  initialSelected: string[];
  /** 시트를 열 때 처음 보여줄 타입 탭. */
  initialType?: CashbookEntryType;
  onApply: (names: string[]) => void;
  onClose: () => void;
};

/**
 * 카테고리 다중선택 전용 바텀시트.
 * 내역 추가 폼의 드릴다운 UI(CategoryChips)와 같은 구조지만, 단일선택이 아닌
 * 다중선택(이름 배열)으로 동작한다. 필터 전용이라 추천/추가/힌트는 뺐다.
 * 카테고리는 이름 기준으로 필터되므로 같은 이름이 여러 소분류에 있으면 함께 선택된다.
 */
export function CategoryFilterSheet({
  categories,
  initialSelected,
  initialType = 'expense',
  onApply,
  onClose,
}: CategoryFilterSheetProps) {
  const [activeType, setActiveType] = useState<CashbookEntryType>(initialType);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState('');
  const [drilledParentId, setDrilledParentId] = useState<string | null>(null);

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const group = activeType as CategoryGroup;
  const typeCategories = categories.filter((c) => c.group === group);
  const parents = typeCategories.filter((c) => c.parentCategoryId === null);
  const parentById = new Map(typeCategories.map((c) => [c.id, c]));
  const childrenByParent = new Map<string, CashbookCategory[]>();
  for (const c of typeCategories) {
    if (c.parentCategoryId) {
      const list = childrenByParent.get(c.parentCategoryId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentCategoryId, list);
    }
  }
  const subGroups = SUB_GROUPS_BY_GROUP[group] ?? [];

  // 현재 타입 탭의 '전체 선택 ↔ 전체 해제' 토글용(이름 기준, 중복 이름은 1개로).
  const tabNames = Array.from(new Set(typeCategories.map((c) => c.name)));
  const allTabSelected = tabNames.length > 0 && tabNames.every((n) => selected.includes(n));

  const toggleSelectAllInTab = () => {
    setSelected((s) => {
      if (allTabSelected) {
        // 현재 탭 카테고리만 해제(다른 탭 선택은 유지).
        const tabSet = new Set(tabNames);
        return s.filter((n) => !tabSet.has(n));
      }
      // 현재 탭 카테고리를 모두 추가(다른 탭 선택은 유지).
      const merged = new Set(s);
      tabNames.forEach((n) => merged.add(n));
      return Array.from(merged);
    });
  };

  const showSearch = typeCategories.length >= SHOW_SEARCH_THRESHOLD;
  const query = search.trim().toLowerCase();
  const searchResults = query
    ? typeCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.examples.some((ex) => ex.toLowerCase().includes(query))
      )
    : [];

  const drilledParent = drilledParentId ? parentById.get(drilledParentId) : undefined;
  const drilledChildren = drilledParent
    ? (childrenByParent.get(drilledParent.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const switchType = (t: CashbookEntryType) => {
    setActiveType(t);
    setSearch('');
    setDrilledParentId(null);
  };

  const chipClass = (isSelected: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
      isSelected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-secondary hover:bg-accent'
    );

  // 선택 가능한 잎 칩(대분류-자식 없음 / 소분류 / 검색결과 공용).
  const renderSelectChip = (cat: CashbookCategory, label?: string) => {
    const isSelected = selected.includes(cat.name);
    return (
      <button
        key={cat.id}
        type="button"
        data-testid={`filter-category-option-${cat.name}`}
        aria-pressed={isSelected}
        className={chipClass(isSelected)}
        onClick={() => toggle(cat.name)}
      >
        <CategoryIcon name={cat.icon} size={14} />
        {label ?? cat.name}
        {isSelected && <Check size={13} aria-hidden />}
      </button>
    );
  };

  return (
    <SheetContent
      side="bottom"
      className="flex max-h-[90vh] flex-col rounded-t-[20px]"
      data-testid="category-filter-sheet"
    >
      <SheetHeader>
        <SheetTitle>카테고리 선택</SheetTitle>
      </SheetHeader>

      <div className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden px-1 pb-4 pt-3">
        <Tabs value={activeType} onValueChange={(v) => switchType(v as CashbookEntryType)}>
          <TabsList className="w-full">
            {TAB_ORDER.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="flex-1"
                data-testid={`category-filter-tab-${type}`}
              >
                {GROUP_LABELS[type as CategoryGroup]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {showSearch && (
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="카테고리 검색"
              aria-label="카테고리 검색"
              data-testid="category-filter-search"
              className="h-9 pl-8"
            />
          </div>
        )}

        {query ? (
          <div data-testid="category-filter-search-results">
            {searchResults.length === 0 ? (
              <p className="text-xs text-muted-foreground">검색 결과가 없어요</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map((cat) => renderSelectChip(cat))}
              </div>
            )}
          </div>
        ) : typeCategories.length === 0 ? (
          <p className="px-1 py-3 text-xs text-muted-foreground">해당 타입의 카테고리가 없어요</p>
        ) : drilledParent ? (
          <div className="space-y-2">
            <button
              type="button"
              data-testid="category-filter-drill-back"
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setDrilledParentId(null)}
            >
              <ChevronLeft size={14} />
              대분류
            </button>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CategoryIcon name={drilledParent.icon} size={14} />
              {drilledParent.name}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {renderSelectChip(drilledParent, `${drilledParent.name} 전체`)}
              {drilledChildren.map((child) => renderSelectChip(child))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {subGroups.map((sg) => {
              const subParents = parents
                .filter((c) => c.subGroup === sg)
                .sort((a, b) => a.sortOrder - b.sortOrder);
              if (subParents.length === 0) return null;
              return (
                <div key={sg}>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {SUB_GROUP_LABELS[sg as CategorySubGroup]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subParents.map((parent) => {
                      const children = childrenByParent.get(parent.id) ?? [];
                      if (children.length === 0) return renderSelectChip(parent);

                      // 자식이 있는 대분류: 탭하면 드릴다운. 자신/자식 중 선택된 개수를 배지로 힌트.
                      const selectedInside =
                        (selected.includes(parent.name) ? 1 : 0) +
                        children.filter((c) => selected.includes(c.name)).length;
                      return (
                        <button
                          key={parent.id}
                          type="button"
                          data-testid={`filter-category-parent-${parent.name}`}
                          className={chipClass(selectedInside > 0)}
                          onClick={() => setDrilledParentId(parent.id)}
                        >
                          <CategoryIcon name={parent.icon} size={16} />
                          {parent.name}
                          {selectedInside > 0 && (
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px] font-normal text-foreground"
                            >
                              {selectedInside}
                            </Badge>
                          )}
                          <ChevronRight
                            size={13}
                            aria-label="하위 카테고리 보기"
                            className="opacity-50"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          data-testid="category-filter-toggle-all"
          onClick={toggleSelectAllInTab}
          disabled={tabNames.length === 0}
        >
          {allTabSelected ? '전체 해제' : '전체 선택'}
        </Button>
        <Button
          type="button"
          className="flex-1"
          data-testid="category-filter-apply"
          onClick={() => {
            onApply(selected);
            onClose();
          }}
        >
          {selected.length > 0 ? `${selected.length}개 적용` : '적용'}
        </Button>
      </div>
    </SheetContent>
  );
}
