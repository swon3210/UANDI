'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { overlay } from 'overlay-kit';
import { Button, EmptyState, Sheet, Skeleton } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useCreateFolder, useFolders } from '@/hooks/useFolders';
import { FolderCard } from '@/components/photos/FolderCard';
import { CreateFolderSheet } from '@/components/photos/CreateFolderSheet';
import { FolderToolbar, type SortOption } from '@/components/photos/FolderToolbar';

type FoldersTabProps = {
  coupleId: string;
};

export function FoldersTab({ coupleId }: FoldersTabProps) {
  const { user } = useAuth();
  const { data, isLoading } = useFolders(coupleId);
  const createMutation = useCreateFolder(coupleId);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const folders = useMemo(() => {
    const roots = (data ?? []).filter((f) => f.parentFolderId === null);
    const q = debouncedQuery.trim().toLowerCase();
    const filtered = q ? roots.filter((f) => f.name.toLowerCase().includes(q)) : roots;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko');
      const aMs = a.createdAt?.toMillis?.() ?? 0;
      const bMs = b.createdAt?.toMillis?.() ?? 0;
      return sortBy === 'latest' ? bMs - aMs : aMs - bMs;
    });
  }, [data, debouncedQuery, sortBy]);

  const handleCreateFolder = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CreateFolderSheet
          isPending={createMutation.isPending}
          onSubmit={async (name) => {
            await createMutation.mutateAsync({ name, userId: user!.uid });
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <div>
      <FolderToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onCreateFolder={handleCreateFolder}
      />
      {folders.length === 0 ? (
        isSearching ? (
          <EmptyState
            icon="🔍"
            title="검색 결과가 없어요"
            description="다른 키워드로 검색해보세요"
          />
        ) : (
          <EmptyState
            icon="📁"
            title="폴더를 만들어 사진을 정리해보세요"
            description="여행, 일상 등 주제별로 사진을 분류할 수 있어요"
            action={<Button onClick={handleCreateFolder}>새 폴더 만들기</Button>}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}
