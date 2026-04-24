'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Skeleton, Avatar, AvatarImage, AvatarFallback } from '@uandi/ui';
import type { Photo } from '@/types';

type PhotoGridProps = {
  photos: Photo[];
  isLoading?: boolean;
  /** uploadedBy → photoURL 매핑 (아바타 뱃지용) */
  uploaderAvatars?: Record<string, string | null>;
  /** 선택 모드 활성 여부 */
  selectable?: boolean;
  /** 선택된 사진 ID Set */
  selectedIds?: Set<string>;
  /** 선택 모드에서 사진 클릭 시 호출 */
  onToggleSelect?: (photoId: string) => void;
};

export function PhotoGrid({
  photos,
  isLoading,
  uploaderAvatars,
  selectable,
  selectedIds,
  onToggleSelect,
}: PhotoGridProps) {
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5" data-testid="photo-grid">
      {photos.map((photo) => {
        const isSelected = selectedIds?.has(photo.id) ?? false;
        const avatarUrl = uploaderAvatars?.[photo.uploadedBy];

        if (selectable) {
          return (
            <button
              key={photo.id}
              type="button"
              className="aspect-square relative overflow-hidden"
              data-testid={`photo-item-${photo.id}`}
              onClick={() => onToggleSelect?.(photo.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl ?? photo.storageUrl}
                alt={photo.caption || '사진'}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {uploaderAvatars && (
                <Avatar className="absolute bottom-1 left-1 h-6 w-6 border-2 border-white" data-testid="uploader-avatar">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">U</AvatarFallback>
                </Avatar>
              )}
              {isSelected && (
                <div
                  className="absolute inset-0 bg-primary/30 flex items-center justify-center"
                  data-testid="check-overlay"
                >
                  <div className="rounded-full bg-primary p-1">
                    <Check size={16} className="text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          );
        }

        return (
          <Link
            key={photo.id}
            href={`/photos/${photo.id}`}
            className="aspect-square relative overflow-hidden"
            data-testid={`photo-item-${photo.id}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbnailUrl ?? photo.storageUrl}
              alt={photo.caption || '사진'}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {uploaderAvatars && (
              <Avatar className="absolute bottom-1 left-1 h-6 w-6 border-2 border-white" data-testid="uploader-avatar">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">U</AvatarFallback>
              </Avatar>
            )}
          </Link>
        );
      })}
    </div>
  );
}
