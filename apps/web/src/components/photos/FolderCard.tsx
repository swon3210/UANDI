'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { Skeleton } from '@uandi/ui';
import type { Folder } from '@/types';
import { useFolderStat } from '@/hooks/usePhotos';

type FolderCardProps = {
  folder: Folder;
};

export function FolderCard({ folder }: FolderCardProps) {
  const { data: stat, isLoading } = useFolderStat(folder.coupleId, folder.id);

  return (
    <Link
      href={`/photos/folder/${folder.id}`}
      className="block rounded-xl overflow-hidden border border-border"
      data-testid={`folder-card-${folder.id}`}
    >
      <div className="aspect-[16/10] relative bg-muted">
        {isLoading ? (
          <Skeleton className="absolute inset-0" />
        ) : stat?.coverUrl ? (
          <Image
            src={stat.coverUrl}
            alt={folder.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <FolderOpen size={48} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-sm font-semibold text-white">{folder.name}</p>
          <p className="text-xs text-white/80">{stat?.count ?? 0}장</p>
        </div>
      </div>
    </Link>
  );
}
