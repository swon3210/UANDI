'use client';

import { Plus } from 'lucide-react';
import { Button, Skeleton } from '@uandi/ui';
import type { Folder } from '@/types';
import { MAX_FOLDER_DEPTH } from '@/types';
import { FolderCard } from './FolderCard';

type SubFolderSectionProps = {
  parentDepth: number;
  subFolders: Folder[];
  isLoading?: boolean;
  onCreateClick: () => void;
};

export function SubFolderSection({
  parentDepth,
  subFolders,
  isLoading,
  onCreateClick,
}: SubFolderSectionProps) {
  const canCreate = parentDepth < MAX_FOLDER_DEPTH;
  const hasSubFolders = subFolders.length > 0;

  if (!hasSubFolders && !isLoading && !canCreate) {
    return null;
  }

  return (
    <section
      data-testid="subfolder-section"
      className="px-4 pt-3 pb-1 space-y-2"
      aria-label="하위 폴더"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">하위 폴더</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateClick}
          disabled={!canCreate}
          data-testid="create-subfolder-btn"
          title={canCreate ? '새 하위 폴더 만들기' : '최대 5단계까지만 만들 수 있어요'}
        >
          <Plus size={16} className="mr-1" />새 하위 폴더
        </Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : hasSubFolders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
