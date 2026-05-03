'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { overlay } from 'overlay-kit';
import {
  Sheet,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@uandi/ui';
import type { Photo, Folder } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useFolders } from '@/hooks/useFolders';
import { useUpdatePhoto, useDeletePhoto, useTagSummary } from '@/hooks/usePhotos';
import { PhotoEditSheet } from '@/components/photos/PhotoEditSheet';
import { SlideshowOverlay } from './SlideshowOverlay';

const IDLE_TIMEOUT = 5000;
const SWIPE_THRESHOLD = 50;

type SlideshowViewProps = {
  photos: Photo[];
  initialIndex?: number;
  folder?: Folder | null;
  onClose: () => void;
};

export function SlideshowView({
  photos: initialPhotos,
  initialIndex = 0,
  folder,
  onClose,
}: SlideshowViewProps) {
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;

  // 편집/삭제로 변하는 사진 목록을 자체 state로 관리. 부모의 props는 진입 시점만 사용.
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(initialPhotos.length - 1, 0))
  );
  const [showCaption, setShowCaption] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('slideshow-show-caption') === 'true';
  });
  const [overlayVisible, setOverlayVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const { data: folders } = useFolders(coupleId);
  const { data: tagSummary } = useTagSummary(coupleId);
  const updateMutation = useUpdatePhoto(coupleId);
  const deleteMutation = useDeletePhoto(coupleId);

  const currentPhoto = photos[currentIndex];
  const currentFolder = useMemo(() => {
    if (!currentPhoto) return folder ?? null;
    return folders?.find((f) => f.id === currentPhoto.folderId) ?? folder ?? null;
  }, [folders, currentPhoto, folder]);
  const tagSuggestions = tagSummary?.map((t) => t.name) ?? [];

  const startIdleTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOverlayVisible(false), IDLE_TIMEOUT);
  }, []);

  const resetIdleTimer = useCallback(() => {
    setOverlayVisible(true);
    startIdleTimer();
  }, [startIdleTimer]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, photos.length - 1));
    resetIdleTimer();
  }, [photos.length, resetIdleTimer]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    startIdleTimer();

    const handleInteraction = () => resetIdleTimer();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startIdleTimer, resetIdleTimer, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStartXRef.current = null;
  };

  const handleEdit = useCallback(() => {
    if (!currentPhoto || !folders) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <PhotoEditSheet
          photo={currentPhoto}
          folders={folders}
          tagSuggestions={tagSuggestions}
          isPending={updateMutation.isPending}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({
              photoId: currentPhoto.id,
              updates: {
                folderId: data.folderId,
                tags: data.tags,
                caption: data.caption,
              },
            });
            // 로컬 photos 배열도 갱신
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === currentPhoto.id
                  ? { ...p, folderId: data.folderId, tags: data.tags, caption: data.caption }
                  : p
              )
            );
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
    resetIdleTimer();
  }, [currentPhoto, folders, tagSuggestions, updateMutation, resetIdleTimer]);

  const handleDelete = useCallback(async () => {
    if (!currentPhoto) return;
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사진 삭제</DialogTitle>
            <DialogDescription>
              이 사진을 삭제하면 복구할 수 없어요. 삭제할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                close(false);
                setTimeout(unmount, 300);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                close(true);
                setTimeout(unmount, 300);
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ));

    resetIdleTimer();
    if (!confirmed) return;

    const deletedId = currentPhoto.id;
    await deleteMutation.mutateAsync({
      photoId: deletedId,
      storageUrl: currentPhoto.storageUrl,
    });

    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== deletedId);
      if (next.length === 0) {
        // 마지막 사진 삭제 → 슬라이드쇼 닫기
        onClose();
        return next;
      }
      // 인덱스 보정 — 마지막 사진을 지웠다면 한 칸 앞으로
      setCurrentIndex((idx) => Math.min(idx, next.length - 1));
      return next;
    });
  }, [currentPhoto, deleteMutation, onClose, resetIdleTimer]);

  if (!currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      data-testid="slideshow-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 사진 */}
      <div className="relative h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.storageUrl}
          alt={currentPhoto.caption || `사진 ${currentIndex + 1}`}
          className="absolute inset-0 h-full w-full object-contain"
          data-testid="slideshow-image"
        />

        {/* 인접 이미지 프리로드 — 숨겨진 img로 브라우저 캐시 워밍 */}
        {currentIndex > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[currentIndex - 1].storageUrl}
            alt=""
            className="hidden"
            aria-hidden
          />
        )}
        {photos.slice(currentIndex + 1, currentIndex + 6).map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.storageUrl}
            alt=""
            className="hidden"
            aria-hidden
          />
        ))}
      </div>

      {/* 좌우 탭 영역 — 클릭 x좌표로 이전/다음 판별 */}
      <div
        className="absolute inset-0 z-30 cursor-default"
        data-testid="slideshow-tap-zone"
        onClick={(e) => {
          const x = e.clientX;
          const w = window.innerWidth;
          if (x < w / 2) goPrev();
          else goNext();
        }}
      />

      {/* 오버레이 */}
      <SlideshowOverlay
        photo={currentPhoto}
        folder={currentFolder}
        currentIndex={currentIndex}
        totalCount={photos.length}
        showCaption={showCaption}
        visible={overlayVisible}
        onClose={onClose}
        onToggleCaption={() => {
          setShowCaption((prev) => {
            const next = !prev;
            sessionStorage.setItem('slideshow-show-caption', String(next));
            return next;
          });
          resetIdleTimer();
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
