'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/button';
import { Switch } from '../../components/switch';

export type SourceListItemSource = {
  id: string;
  siteName: string;
  feedUrl: string;
  enabled: boolean;
  lastCrawledAt: string | null; // ISO 문자열
  lastError: string | null;
};

export type SourceListItemProps = {
  source: SourceListItemSource;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  isPending?: boolean;
};

function formatCrawledAt(iso: string | null): string {
  if (!iso) return '아직 수집 안 함';
  return new Date(iso).toLocaleString('ko-KR');
}

export function SourceListItem({
  source,
  onToggle,
  onEdit,
  onDelete,
  isPending,
}: SourceListItemProps) {
  return (
    <article
      data-testid="source-list-item"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-medium" title={source.siteName}>
            {source.siteName}
          </h3>
          <p className="truncate text-xs text-muted-foreground" title={source.feedUrl}>
            {source.feedUrl}
          </p>
        </div>
        <Switch
          checked={source.enabled}
          onCheckedChange={onToggle}
          disabled={isPending}
          aria-label={source.enabled ? '비활성화' : '활성화'}
          data-testid="source-toggle"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        마지막 수집: {formatCrawledAt(source.lastCrawledAt)}
      </p>
      {source.lastError ? (
        <p className="text-xs text-destructive" data-testid="source-error">
          수집 오류: {source.lastError}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} disabled={isPending}>
          <Pencil size={14} className="mr-1" />
          수정
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 size={14} className="mr-1" />
          삭제
        </Button>
      </div>
    </article>
  );
}
