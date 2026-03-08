'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@uandi/ui';
import type { Photo } from '@/types';

type PhotoGridProps = {
  photos: Photo[];
  isLoading?: boolean;
};

export function PhotoGrid({ photos, isLoading }: PhotoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
      {photos.map((photo) => (
        <Link
          key={photo.id}
          href={`/photos/${photo.id}`}
          className="aspect-square relative overflow-hidden"
        >
          <Image
            src={photo.thumbnailUrl ?? photo.storageUrl}
            alt={photo.caption || '사진'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
      ))}
    </div>
  );
}
