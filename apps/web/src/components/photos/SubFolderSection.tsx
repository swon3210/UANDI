'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { EmptyState, Skeleton } from '@uandi/ui';
import type { Folder } from '@/types';
import { FolderCard } from './FolderCard';
import { FolderToolbar, type SortOption } from './FolderToolbar';

type SubFolderSectionProps = {
  subFolders: Folder[];
  isLoading?: boolean;
};

export function SubFolderSection({ subFolders, isLoading }: SubFolderSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const visibleFolders = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const filtered = q ? subFolders.filter((f) => f.name.toLowerCase().includes(q)) : subFolders;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
      const aMs = a.createdAt?.toMillis?.() ?? 0;
      const bMs = b.createdAt?.toMillis?.() ?? 0;
      return sortBy === 'latest' ? bMs - aMs : aMs - bMs;
    });
  }, [subFolders, debouncedQuery, sortBy]);

  const hasSubFolders = subFolders.length > 0;

  if (!hasSubFolders && !isLoading) {
    return null;
  }

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <section
      data-testid="subfolder-section"
      className="px-4 pt-3 pb-1 space-y-2"
      aria-label="하위 폴더"
    >
      <h2 className="text-sm font-medium text-muted-foreground">하위 폴더</h2>
      {hasSubFolders && (
        <FolderToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          searchTestId="subfolder-search-input"
          sortTestId="subfolder-sort-select"
          searchPlaceholder="하위 폴더 검색"
          searchAriaLabel="하위 폴더 검색"
          sortAriaLabel="하위 폴더 정렬"
        />
      )}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : visibleFolders.length === 0 ? (
        isSearching ? (
          <EmptyState
            icon="🔍"
            title="검색 결과가 없어요"
            description="다른 키워드로 검색해보세요"
          />
        ) : null
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </section>
  );
}
