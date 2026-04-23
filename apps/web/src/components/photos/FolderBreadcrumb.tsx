'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Folder } from '@/types';

type FolderBreadcrumbProps = {
  ancestors: Folder[];
  current: Folder;
};

export function FolderBreadcrumb({ ancestors, current }: FolderBreadcrumbProps) {
  return (
    <nav
      aria-label="폴더 경로"
      data-testid="folder-breadcrumb"
      className="flex items-center gap-1 overflow-x-auto px-4 py-2 text-sm text-muted-foreground"
    >
      <Link
        href="/photos?tab=folders"
        className="shrink-0 hover:text-foreground"
      >
        사진
      </Link>
      {ancestors.map((folder) => (
        <span key={folder.id} className="flex items-center gap-1">
          <ChevronRight size={14} className="shrink-0 opacity-60" />
          <Link
            href={`/photos/folder/${folder.id}`}
            className="shrink-0 truncate max-w-[120px] hover:text-foreground"
          >
            {folder.name}
          </Link>
        </span>
      ))}
      <span className="flex items-center gap-1">
        <ChevronRight size={14} className="shrink-0 opacity-60" />
        <span
          aria-current="page"
          className="truncate max-w-[160px] font-medium text-foreground"
        >
          {current.name}
        </span>
      </span>
    </nav>
  );
}
