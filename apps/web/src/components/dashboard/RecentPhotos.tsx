'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button, Skeleton } from '@uandi/ui';
import { useRecentPhotos } from '@/hooks/usePhotos';

type RecentPhotosProps = {
  coupleId: string;
};

export function RecentPhotos({ coupleId }: RecentPhotosProps) {
  const { data: photos, isLoading } = useRecentPhotos(coupleId);

  return (
    <section data-testid="recent-photos">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">최근 사진</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/photos">전체 보기</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos?.map((photo) => (
            <Link
              key={photo.id}
              href={`/photos/${photo.id}`}
              data-testid="photo-thumbnail"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.storageUrl}
                alt={photo.caption || '사진'}
                width={200}
                height={200}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover"
              />
            </Link>
          ))}
          {Array.from({ length: Math.max(0, 3 - (photos?.length ?? 0)) }).map((_, i) => (
            <Link
              key={`placeholder-${i}`}
              href="/photos"
              data-testid="photo-upload-placeholder"
              className="flex aspect-square items-center justify-center rounded-xl bg-border"
            >
              <Plus size={24} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
