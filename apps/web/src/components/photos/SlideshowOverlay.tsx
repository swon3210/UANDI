'use client';

import Link from 'next/link';
import { X, Type } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { Photo } from '@/types';
import type { Folder } from '@/types';

type SlideshowOverlayProps = {
  photo: Photo;
  folder?: Folder | null;
  currentIndex: number;
  totalCount: number;
  showCaption: boolean;
  visible: boolean;
  onClose: () => void;
  onToggleCaption: () => void;
};

export function SlideshowOverlay({
  photo,
  folder,
  currentIndex,
  totalCount,
  showCaption,
  visible,
  onClose,
  onToggleCaption,
}: SlideshowOverlayProps) {
  return (
    <div
      data-testid="slideshow-overlay"
      className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 상단 오버레이 */}
      <div className="pointer-events-auto absolute top-0 left-0 right-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 pt-4 pb-12">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="닫기"
          data-testid="slideshow-close-btn"
        >
          <X size={24} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`text-white hover:bg-white/20 ${showCaption ? 'bg-white/20' : ''}`}
          onClick={onToggleCaption}
          aria-label="캡션 토글"
          data-testid="slideshow-caption-toggle"
        >
          <Type size={20} />
        </Button>
      </div>

      {/* 하단 오버레이 */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-12 pb-6 text-white">
        {folder && (
          <Link
            href={`/photos/folder/${folder.id}`}
            className="mb-1 flex items-center gap-1 text-sm font-medium hover:underline"
            data-testid="slideshow-folder-name"
          >
            📁 {folder.name}
          </Link>
        )}
        {photo.tags.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5" data-testid="slideshow-tags">
            {photo.tags.map((tag) => (
              <Link
                key={tag}
                href={`/photos/tag/${encodeURIComponent(tag)}`}
                className="text-sm text-white/80 hover:text-white hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        <p className="text-sm text-white/70" data-testid="slideshow-position">
          {currentIndex + 1} / {totalCount}
        </p>
        {showCaption && photo.caption && (
          <p className="mt-2 text-sm text-white/90" data-testid="slideshow-caption">
            {photo.caption}
          </p>
        )}
      </div>
    </div>
  );
}
