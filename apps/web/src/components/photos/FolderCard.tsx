'use client';

import Link from 'next/link';
import { FolderOpen, Folders } from 'lucide-react';
import { Skeleton } from '@uandi/ui';
import type { Folder } from '@/types';
import { useFolderStat } from '@/hooks/usePhotos';

type FolderCardProps = {
  folder: Folder;
  subfolderCount?: number;
};

export function FolderCard({ folder, subfolderCount = 0 }: FolderCardProps) {
  const { data: stat, isLoading } = useFolderStat(folder.coupleId, folder.id);
  const hasSubfolders = subfolderCount > 0;

  return (
    <Link
      href={`/inner/photos/folder/${folder.id}`}
      className="block rounded-xl overflow-hidden border border-border"
      data-testid={`folder-card-${folder.id}`}
    >
      <div className="aspect-[16/10] relative bg-muted">
        {isLoading ? (
          <Skeleton className="absolute inset-0" />
        ) : stat?.coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stat.coverUrl}
              alt={folder.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-sm font-semibold text-white">{folder.name}</p>
              <p className="text-xs text-white/80">{stat?.count ?? 0}장</p>
            </div>
          </>
        ) : (
          <div
            className={
              hasSubfolders
                ? 'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/20 via-primary/10 to-background px-3'
                : 'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-background to-background px-3'
            }
          >
            {hasSubfolders ? (
              <Folders size={36} strokeWidth={1.5} className="text-primary/70" aria-hidden />
            ) : (
              <FolderOpen size={36} strokeWidth={1.5} className="text-primary/60" aria-hidden />
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{folder.name}</p>
              <p className="text-xs text-muted-foreground">
                {hasSubfolders ? `하위 폴더 ${subfolderCount}개` : `${stat?.count ?? 0}장`}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
