'use client';

import { useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Input } from '@uandi/ui';
import type { CashbookCategory, CashbookEntryType, CategoryGroup, CategorySubGroup } from '@/types';
import {
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_LABELS,
  SUB_GROUP_SHORT_LABELS,
} from '@/constants/default-categories';
import { CategoryIcon } from './CategoryIcon';

const MAX_RECOMMENDATIONS = 3;
// 이 개수 이상일 때만 검색창을 노출(소수일 땐 드릴다운만으로 충분).
const SHOW_SEARCH_THRESHOLD = 8;

function findCategoryByName(
  categories: CashbookCategory[],
  name: string,
  group: CategoryGroup
): CashbookCategory | undefined {
  return categories.find((c) => c.name === name && c.group === group);
}

function recommendCategories(categories: CashbookCategory[], memo: string): CashbookCategory[] {
  const trimmed = memo.trim();
  if (trimmed.length === 0) return [];
  const lower = trimmed.toLowerCase();
  const matches: CashbookCategory[] = [];
  for (const cat of categories) {
    const hit =
      cat.examples.some((ex) => {
        const exLower = ex.toLowerCase();
        return exLower.includes(lower) || lower.includes(exLower);
      }) || cat.name.toLowerCase().includes(lower);
    if (hit) matches.push(cat);
    if (matches.length >= MAX_RECOMMENDATIONS) break;
  }
  return matches;
}

export type CategoryChipsProps = {
  categories: CashbookCategory[];
  activeType: CashbookEntryType;
  value: string;
  memo?: string;
  onChange: (v: string) => void;
  onAddCategory?: () => void;
  disableAdd?: boolean;
  hideAdd?: boolean;
  hideHint?: boolean;
};

export function CategoryChips({
  categories,
  activeType,
  value,
  memo = '',
  onChange,
  onAddCategory,
  disableAdd,
  hideAdd,
  hideHint,
}: CategoryChipsProps) {
  const group = activeType as CategoryGroup;
  const subGroups = SUB_GROUPS_BY_GROUP[group] ?? [];

  const parentById = new Map(categories.map((c) => [c.id, c]));
  const parents = categories.filter((c) => c.parentCategoryId === null);
  const childrenByParent = new Map<string, CashbookCategory[]>();
  for (const c of categories) {
    if (c.parentCategoryId) {
      const list = childrenByParent.get(c.parentCategoryId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentCategoryId, list);
    }
  }

  const selectedCat = value ? findCategoryByName(categories, value, group) : undefined;
  const selectedParent = selectedCat?.parentCategoryId
    ? parentById.get(selectedCat.parentCategoryId)
    : undefined;
  const presetNames = new Set(categories.map((c) => c.name));
  const hasOrphanValue = value !== '' && !presetNames.has(value);

  const recommended = recommendCategories(categories, memo).filter((c) => c.name !== value);

  const [search, setSearch] = useState('');
  // 자식이 선택된 채로 열리면(수정 등) 해당 부모의 소분류 화면에서 시작한다.
  const [drilledParentId, setDrilledParentId] = useState<string | null>(selectedParent?.id ?? null);

  const showSearch = categories.length >= SHOW_SEARCH_THRESHOLD;
  const query = search.trim().toLowerCase();
  const searchResults = query
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.examples.some((ex) => ex.toLowerCase().includes(query))
      )
    : [];

  // drilledParentId가 가리키는 부모가 현재 목록에 없으면(탭 전환 등) 대분류 화면으로 폴백.
  const drilledParent = drilledParentId ? parentById.get(drilledParentId) : undefined;
  const drilledChildren = drilledParent
    ? (childrenByParent.get(drilledParent.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const chipClass = (selected: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
      selected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-secondary hover:bg-accent'
    }`;

  // 선택 가능한 칩(검색 결과/소분류 화면 공용). 선택 시 검색을 비우고 알맞은 화면으로 이동한다.
  const renderSelectChip = (cat: CashbookCategory, label?: string) => (
    <button
      key={cat.id}
      type="button"
      data-testid={`category-chip-${cat.name}`}
      className={chipClass(value === cat.name)}
      onClick={() => {
        onChange(cat.name);
        setSearch('');
        setDrilledParentId(cat.parentCategoryId ?? null);
      }}
    >
      <CategoryIcon name={cat.icon} size={14} />
      {label ?? cat.name}
      {cat.parentCategoryId && (
        <Badge variant="secondary" className="px-1 py-0 text-[9px] font-normal">
          {SUB_GROUP_SHORT_LABELS[cat.subGroup]}
        </Badge>
      )}
    </button>
  );

  return (
    <div className="space-y-3">
      {showSearch && (
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            data-testid="category-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="카테고리 검색"
            className="h-9 pl-8"
          />
        </div>
      )}

      {query ? (
        <div data-testid="category-search-results">
          {searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground">검색 결과가 없어요</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {searchResults.map((cat) => renderSelectChip(cat))}
            </div>
          )}
        </div>
      ) : drilledParent ? (
        <div className="space-y-2">
          <button
            type="button"
            data-testid="category-drill-back"
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
            const subParents = parents.filter((c) => c.subGroup === sg);
            if (subParents.length === 0) return null;
            return (
              <div key={sg}>
                <div className="mb-1 text-xs text-muted-foreground">
                  {SUB_GROUP_LABELS[sg as CategorySubGroup]}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subParents.map((parent) => {
                    const hasChildren = (childrenByParent.get(parent.id)?.length ?? 0) > 0;
                    const isSelected = value === parent.name && !selectedParent;
                    return (
                      <button
                        key={parent.id}
                        type="button"
                        data-testid={`category-chip-${parent.name}`}
                        className={chipClass(isSelected)}
                        onClick={() => {
                          if (hasChildren) setDrilledParentId(parent.id);
                          else onChange(parent.name);
                        }}
                      >
                        <CategoryIcon name={parent.icon} size={16} />
                        {parent.name}
                        {hasChildren && (
                          <ChevronRight
                            size={13}
                            aria-label="하위 카테고리 보기"
                            className="opacity-50"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasOrphanValue && !query && (
        <div>
          <div className="mb-1 text-xs text-muted-foreground">선택됨</div>
          <button
            type="button"
            data-testid={`category-chip-${value}`}
            className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        </div>
      )}

      {!hideHint && selectedCat && (
        <div className="rounded-md border border-border bg-muted/50 p-2.5 text-xs">
          <div data-testid="category-breadcrumb" className="font-medium">
            {selectedParent ? (
              <>
                {selectedParent.name}{' '}
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  {SUB_GROUP_SHORT_LABELS[selectedParent.subGroup]}
                </Badge>{' '}
                <span className="text-muted-foreground">&gt;</span> {selectedCat.name}
              </>
            ) : (
              <>
                {selectedCat.name}{' '}
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  {SUB_GROUP_SHORT_LABELS[selectedCat.subGroup]}
                </Badge>
              </>
            )}
          </div>
          {(selectedCat.description || selectedCat.examples.length > 0) && (
            <div data-testid="category-hint" className="mt-1 text-muted-foreground">
              {selectedCat.description && <span>{selectedCat.description}</span>}
              {selectedCat.examples.length > 0 && (
                <span>
                  {selectedCat.description ? ' · ' : ''}예시: {selectedCat.examples.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {!query && recommended.length > 0 && (
        <div data-testid="category-recommendations">
          <div className="mb-1 text-xs text-muted-foreground">메모와 비슷한 카테고리</div>
          <div className="flex flex-wrap gap-1.5">
            {recommended.map((cat) => (
              <button
                key={`rec-${cat.id}`}
                type="button"
                data-testid={`recommended-chip-${cat.name}`}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-primary/60 bg-accent px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  onChange(cat.name);
                  setSearch('');
                  setDrilledParentId(cat.parentCategoryId ?? null);
                }}
              >
                <CategoryIcon name={cat.icon} size={12} />
                {cat.name}
                <Badge variant="secondary" className="px-1 py-0 text-[9px] font-normal">
                  {SUB_GROUP_SHORT_LABELS[cat.subGroup]}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hideAdd && onAddCategory && (
        <button
          type="button"
          data-testid="category-chip-add"
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-muted-foreground"
          onClick={onAddCategory}
          disabled={disableAdd}
        >
          <Plus size={14} />
          카테고리 추가
        </button>
      )}
    </div>
  );
}
