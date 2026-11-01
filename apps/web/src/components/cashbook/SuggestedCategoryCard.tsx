'use client';

import { Checkbox, Input, cn } from '@uandi/ui';
import {
  GROUP_LABELS,
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_SHORT_LABELS,
} from '@/constants/default-categories';
import type { CategorySubGroup } from '@/types';
import { CategoryIcon } from './CategoryIcon';
import type { SuggestedCategoryDraft } from './import-types';

type SuggestedCategoryCardProps = {
  draft: SuggestedCategoryDraft;
  onChange: (next: SuggestedCategoryDraft) => void;
  /** 이름 검증 에러(비어 있음·중복). 있으면 입력 아래에 표시한다 */
  error?: string;
  /** 아이콘 색. 저장 시 COLOR_PRESETS 순환값과 같은 색을 미리 보여준다 */
  color?: string;
  className?: string;
};

/**
 * AI가 제안한 새 카테고리 한 장 — 포함 체크, 이름 수정, 구분(정기/비정기·고정/공통/각자) 선택.
 * 체크를 풀면 흐려지고 입력이 잠긴다(해당 내역은 '기타'로 간다).
 */
export function SuggestedCategoryCard({
  draft,
  onChange,
  error,
  color = '#908B85',
  className,
}: SuggestedCategoryCardProps) {
  const subGroups = SUB_GROUPS_BY_GROUP[draft.group];
  const inputId = `suggested-category-name-${draft.originalName}`;

  return (
    <div
      data-testid="suggested-category"
      className={cn(
        'rounded-xl border border-border bg-card p-3 transition-opacity',
        !draft.included && 'opacity-60',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={draft.included}
          onCheckedChange={(checked) => onChange({ ...draft, included: checked === true })}
          aria-label={`${draft.name || draft.originalName} 포함`}
        />
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <CategoryIcon name={draft.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {draft.name || draft.originalName}
          </p>
          <p className="text-xs text-muted-foreground">
            {GROUP_LABELS[draft.group]} · {draft.entryCount}건
          </p>
        </div>
      </div>

      <div className={cn('mt-3 space-y-2', !draft.included && 'pointer-events-none')}>
        <div>
          <label htmlFor={inputId} className="sr-only">
            카테고리 이름
          </label>
          <Input
            id={inputId}
            value={draft.name}
            maxLength={20}
            disabled={!draft.included}
            aria-invalid={Boolean(error)}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="카테고리 이름"
          />
          {error ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="구분">
          {subGroups.map((sg: CategorySubGroup) => {
            const active = sg === draft.subGroup;
            return (
              <button
                key={sg}
                type="button"
                aria-pressed={active}
                disabled={!draft.included}
                onClick={() => onChange({ ...draft, subGroup: sg })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                {SUB_GROUP_SHORT_LABELS[sg]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
