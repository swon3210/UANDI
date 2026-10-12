'use client';

import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Button, cn, Input, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';

export type CompareCategoryOption = {
  name: string;
  color: string;
};

type Props = {
  /** 선택 가능한 카테고리 (금액 내림차순 권장) */
  options: CompareCategoryOption[];
  /** 이미 선택된 카테고리. 시트는 이 값을 draft로 복제해 편집한다. */
  initialSelected: string[];
  onApply: (names: string[]) => void;
  onClose: () => void;
};

/**
 * 기간 비교 차트의 비교 대상 카테고리를 고르는 바텀시트.
 * 카테고리가 많아도 고르기 쉽게 검색 + 세로 목록으로 보여주고, '적용'을 눌러야 반영된다.
 */
export function CompareCategorySheet({ options, initialSelected, onApply, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState('');

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((n) => n !== name) : [...s, name]));

  const query = search.trim().toLowerCase();
  const visible = query ? options.filter((o) => o.name.toLowerCase().includes(query)) : options;

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
        <SheetTitle>비교할 카테고리 선택</SheetTitle>
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
        {visible.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted-foreground">
            검색 결과가 없어요
          </li>
        ) : (
          visible.map((opt) => {
            const isSelected = selected.includes(opt.name);
            return (
              <li key={opt.name}>
                <button
                  type="button"
                  onClick={() => toggle(opt.name)}
                  aria-pressed={isSelected}
                  data-testid={`compare-category-option-${opt.name}`}
                  data-state={isSelected ? 'selected' : 'unselected'}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card'
                    )}
                  >
                    {isSelected ? <Check size={13} aria-hidden /> : null}
                  </span>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{opt.name}</span>
                </button>
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
