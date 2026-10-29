'use client';

import { useState } from 'react';
import { Check, Minus, Search } from 'lucide-react';
import { Button, cn, Input, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import { CategoryIcon } from '@/components/cashbook/CategoryIcon';
import { CATEGORY_ICON_MAP } from '@/constants/category-icons';
import type { CashbookCategory, CategoryGroup } from '@/types';

export type CompareCategoryOption = {
  name: string;
  color: string;
  /** 카테고리 아이콘 키. 메타에 없는 카테고리(삭제됨 등)는 생략 → 색 점으로 대체 */
  icon?: string;
  /** 상위(레벨 1) 카테고리 이름. 본인이 상위이거나 메타에 없으면 null */
  parent: string | null;
  /** 상위 카테고리 아이콘 키. 상위에 직접 기록된 내역이 없어 묶음 헤더만 그릴 때 쓴다 */
  parentIcon?: string;
  /** 상위 카테고리 색. 묶음 헤더만 그릴 때 아이콘 색으로 쓴다 */
  parentColor?: string;
};

/**
 * 카테고리 메타로 시트 항목을 만드는 함수를 돌려준다 (아이콘·상위/하위 묶음 정보).
 * 메타에 없는 카테고리(삭제·이름 변경)는 아이콘·상위 없이 색 점만.
 */
export function makeCategoryOption(
  categories: CashbookCategory[] | undefined,
  group: CategoryGroup
): (name: string, color: string) => CompareCategoryOption {
  const groupCategories = (categories ?? []).filter((c) => c.group === group);
  const byId = new Map(groupCategories.map((c) => [c.id, c]));
  const byName = new Map(groupCategories.map((c) => [c.name, c]));
  return (name, color) => {
    const meta = byName.get(name);
    const parent = meta?.parentCategoryId ? byId.get(meta.parentCategoryId) : undefined;
    return {
      name,
      color,
      icon: meta?.icon,
      parent: parent?.name ?? null,
      parentIcon: parent?.icon,
      parentColor: parent?.color,
    };
  };
}

type CategoryGroupNode = {
  /** 상위 카테고리 이름 */
  name: string;
  /** 상위 카테고리 자체가 선택 가능한 옵션이면 그 옵션 (상위에 직접 기록된 내역이 있을 때) */
  self: CompareCategoryOption | null;
  /** 상위 카테고리 아이콘 키 */
  icon?: string;
  /** 상위 카테고리 색 */
  color?: string;
  children: CompareCategoryOption[];
};

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'ko');

/**
 * 옵션을 상위 → 하위 2단계로 묶는다. 상위·하위 모두 이름 가나다 순으로 정렬한다.
 * 하위만 있고 상위에 직접 기록된 내역이 없으면 상위는 선택 대상이 아닌 묶음 헤더(self=null)로만 쓴다.
 */
function buildGroups(options: CompareCategoryOption[]): CategoryGroupNode[] {
  const groups = new Map<string, CategoryGroupNode>();
  const groupOf = (name: string) => {
    let g = groups.get(name);
    if (!g) {
      g = { name, self: null, children: [] };
      groups.set(name, g);
    }
    return g;
  };
  for (const opt of options) {
    if (opt.parent) {
      const g = groupOf(opt.parent);
      g.children.push(opt);
      g.icon ??= opt.parentIcon;
      g.color ??= opt.parentColor;
    } else {
      const g = groupOf(opt.name);
      g.self = opt;
      g.icon = opt.icon;
    }
  }
  const sorted = [...groups.values()].sort(byName);
  for (const g of sorted) g.children.sort(byName);
  return sorted;
}

/** 검색어로 그룹을 거른다. 상위 이름이 맞으면 하위 전체를, 아니면 이름이 맞는 하위만 남긴다. */
function filterGroups(groups: CategoryGroupNode[], query: string): CategoryGroupNode[] {
  if (!query) return groups;
  const hit = (name: string) => name.toLowerCase().includes(query);
  return groups.flatMap((g) => {
    if (hit(g.name)) return [g];
    const children = g.children.filter((c) => hit(c.name));
    return children.length > 0 ? [{ ...g, self: null, children }] : [];
  });
}

type Props = {
  /** 선택 가능한 카테고리. 표시 순서는 시트가 가나다 순으로 정한다 */
  options: CompareCategoryOption[];
  /** 이미 선택된 카테고리. 시트는 이 값을 draft로 복제해 편집한다. */
  initialSelected: string[];
  onApply: (names: string[]) => void;
  onClose: () => void;
  /** 시트 제목 */
  title?: string;
};

/**
 * 카테고리를 고르는 바텀시트 (기간 비교 대상, 전체 탭 도넛 표시 대상).
 * 카테고리가 많아도 고르기 쉽게 검색 + 세로 목록으로 보여주고, '적용'을 눌러야 반영된다.
 */
export function CompareCategorySheet({
  options,
  initialSelected,
  onApply,
  onClose,
  title = '비교할 카테고리 선택',
}: Props) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState('');

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  // 상위 행: 상위 자신(선택 가능할 때) + 하위 전체를 한 번에 선택/해제한다.
  const toggleGroup = (names: string[]) =>
    setSelected((s) => {
      const allOn = names.every((n) => s.includes(n));
      if (allOn) return s.filter((n) => !names.includes(n));
      return [...s, ...names.filter((n) => !s.includes(n))];
    });

  const query = search.trim().toLowerCase();
  const groups = filterGroups(buildGroups(options), query);

  return (
    <SheetContent
      side="bottom"
      // 검색 결과 수에 따라 시트 높이가 출렁이지 않도록 최소 높이를 둔다
      className="flex max-h-[90vh] min-h-[60vh] flex-col rounded-t-[20px]"
      data-testid="compare-category-sheet"
      // 열자마자 검색창에 포커스가 가면 모바일 키보드가 올라와 목록을 가리므로 막는다
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>

      <div className="relative mt-3">
        <Search
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="카테고리 검색"
          aria-label="카테고리 검색"
          data-testid="compare-category-search"
          className="h-9 pl-8"
        />
      </div>

      <div className="px-1 pt-3 text-[11px] text-muted-foreground">{selected.length}개 선택됨</div>

      <ul className="-mx-1 flex-1 overflow-y-auto py-1" data-testid="compare-category-list">
        {groups.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted-foreground">
            검색 결과가 없어요
          </li>
        ) : (
          groups.map((g) => {
            // 하위가 없는 상위는 일반 단일 항목과 같다.
            if (g.children.length === 0 && g.self) {
              return (
                <li key={g.name}>
                  <OptionRow
                    option={g.self}
                    state={selected.includes(g.name) ? 'selected' : 'unselected'}
                    onClick={() => toggle(g.name)}
                  />
                </li>
              );
            }
            const names = [...(g.self ? [g.self.name] : []), ...g.children.map((c) => c.name)];
            const onCount = names.filter((n) => selected.includes(n)).length;
            const groupState: RowState =
              onCount === 0 ? 'unselected' : onCount === names.length ? 'selected' : 'partial';
            return (
              <li key={g.name} data-testid={`compare-category-group-${g.name}`}>
                <OptionRow
                  option={
                    g.self ?? {
                      name: g.name,
                      color: g.color ?? 'transparent',
                      icon: g.icon,
                      parent: null,
                    }
                  }
                  state={groupState}
                  onClick={() => toggleGroup(names)}
                  isGroup
                />
                <ul>
                  {g.children.map((c) => (
                    <li key={c.name}>
                      <OptionRow
                        option={c}
                        state={selected.includes(c.name) ? 'selected' : 'unselected'}
                        onClick={() => toggle(c.name)}
                        indent
                      />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          data-testid="compare-category-clear"
          onClick={() => setSelected([])}
          disabled={selected.length === 0}
        >
          전체 해제
        </Button>
        <Button
          type="button"
          className="flex-1"
          data-testid="compare-category-apply"
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

type RowState = 'selected' | 'unselected' | 'partial';

function OptionRow({
  option,
  state,
  onClick,
  isGroup = false,
  indent = false,
}: {
  option: CompareCategoryOption;
  state: RowState;
  onClick: () => void;
  /** 하위를 묶는 상위 행 (부분 선택 상태를 가질 수 있음) */
  isGroup?: boolean;
  /** 하위 행 들여쓰기 */
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={state === 'partial' ? 'mixed' : state === 'selected'}
      data-testid={
        isGroup
          ? `compare-category-group-toggle-${option.name}`
          : `compare-category-option-${option.name}`
      }
      data-state={state}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg py-2.5 pr-2 text-left transition-colors hover:bg-accent',
        indent ? 'pl-9' : 'pl-2'
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
          state === 'unselected'
            ? 'border-border bg-card'
            : 'border-primary bg-primary text-primary-foreground'
        )}
      >
        {state === 'selected' ? <Check size={13} aria-hidden /> : null}
        {state === 'partial' ? <Minus size={13} aria-hidden /> : null}
      </span>
      <OptionIcon option={option} />
      <span className={cn('min-w-0 flex-1 truncate text-sm', isGroup && 'font-medium')}>
        {option.name}
      </span>
    </button>
  );
}

/** 카테고리 아이콘(카테고리 색). 아이콘을 모르는 카테고리는 기존처럼 색 점으로 표시한다. */
function OptionIcon({ option }: { option: CompareCategoryOption }) {
  if (option.icon && CATEGORY_ICON_MAP[option.icon]) {
    return (
      <span
        data-testid={`compare-category-icon-${option.name}`}
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        aria-hidden
      >
        <CategoryIcon
          name={option.icon}
          size={18}
          color={option.color === 'transparent' ? undefined : option.color}
        />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />
    </span>
  );
}
