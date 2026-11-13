'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@uandi/ui';
import { COLOR_PRESETS } from '@/constants/default-categories';
import { SuggestedCategoryCard } from './SuggestedCategoryCard';
import type { SuggestedCategoryDraft, UsedCategoryCount } from './import-types';

type SuggestedCategoryListProps = {
  drafts: SuggestedCategoryDraft[];
  usedCategories: UsedCategoryCount[];
  /** index → 에러 메시지 */
  errors?: Record<number, string>;
  onChange: (index: number, next: SuggestedCategoryDraft) => void;
  /** 저장 시 새 카테고리에 돌아가며 입힐 색. 미리보기에도 같은 순서로 쓴다 */
  colorOffset?: number;
};

/** 제안 카테고리 i번째의 색 — 저장 시 addCategory에도 같은 규칙을 쓴다. */
export function suggestedCategoryColor(index: number, offset = 0): string {
  return COLOR_PRESETS[(offset + index) % COLOR_PRESETS.length];
}

/**
 * 2단계 "이런 카테고리로 나눴어요" — 새로 제안된 카테고리 카드 목록 + 쓰인 기본 카테고리 칩.
 * 제안이 0개면 "기본 카테고리로 충분해요" 한 줄만 보여준다.
 */
export function SuggestedCategoryList({
  drafts,
  usedCategories,
  errors = {},
  onChange,
  colorOffset = 0,
}: SuggestedCategoryListProps) {
  const t = useTranslations('cashbook.suggested');
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t('newTitle')}{' '}
          <span className="font-normal text-muted-foreground">({drafts.length})</span>
        </h3>
        {drafts.length === 0 ? (
          <p
            data-testid="suggested-category-empty"
            className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground"
          >
            {t('noneNeeded')}
          </p>
        ) : (
          <div className="space-y-2">
            {drafts.map((d, i) => (
              <SuggestedCategoryCard
                key={d.originalName}
                draft={d}
                error={errors[i]}
                color={suggestedCategoryColor(i, colorOffset)}
                onChange={(next) => onChange(i, next)}
              />
            ))}
          </div>
        )}
      </section>

      {usedCategories.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t('usedTitle')}{' '}
            <span className="font-normal text-muted-foreground">({usedCategories.length})</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {usedCategories.map((u) => (
              <Badge
                key={u.name}
                variant="secondary"
                data-testid="used-default-category"
                className="gap-1 font-normal"
              >
                {u.name}
                <span className="tabular-nums text-muted-foreground">{u.count}</span>
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
