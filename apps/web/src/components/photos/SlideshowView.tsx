'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import type { Photo } from '@/types';
import type { Folder } from '@/types';
import { SlideshowOverlay } from './SlideshowOverlay';

const IDLE_TIMEOUT = 5000;
const SWIPE_THRESHOLD = 50;

type SlideshowViewProps = {
  photos: Photo[];
  folder?: Folder | null;
  onClose: () => void;
};

export function SlideshowView({ photos, folder, onClose }: SlideshowViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCaption, setShowCaption] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const currentPhoto = photos[currentIndex];

  const startIdleTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOverlayVisible(false), IDLE_TIMEOUT);
  }, []);

  const resetIdleTimer = useCallback(() => {
    setOverlayVisible(true);
    startIdleTimer();
  }, [startIdleTimer]);

  // 초기 타이머 설정 + 인터랙션 이벤트 리스너
  useEffect(() => {
    startIdleTimer();

    const handleInteraction = () => resetIdleTimer();
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [startIdleTimer, resetIdleTimer]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, photos.length - 1));
    resetIdleTimer();
  }, [photos.length, resetIdleTimer]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    resetIdleTimer();
  }, [resetIdleTimer]);

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
        <Image
          src={currentPhoto.storageUrl}
          alt={currentPhoto.caption || `사진 ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
          data-testid="slideshow-image"
        />

        {/* 인접 이미지 프리로드 */}
        {currentIndex > 0 && (
          <link rel="preload" as="image" href={photos[currentIndex - 1].storageUrl} />
        )}
        {currentIndex < photos.length - 1 && (
          <link rel="preload" as="image" href={photos[currentIndex + 1].storageUrl} />
        )}
      </div>

      {/* 좌우 탭 영역 (사진 위에 투명하게) */}
      <div className="absolute inset-0 z-20 flex">
        <button
          className="h-full w-1/3 cursor-default"
          onClick={goPrev}
          aria-label="이전 사진"
          data-testid="slideshow-prev-zone"
        />
        <div className="h-full w-1/3" />
        <button
          className="h-full w-1/3 cursor-default"
          onClick={goNext}
          aria-label="다음 사진"
          data-testid="slideshow-next-zone"
        />
      </div>

      {/* 오버레이 */}
      <SlideshowOverlay
        photo={currentPhoto}
        folder={folder}
        currentIndex={currentIndex}
        totalCount={photos.length}
        showCaption={showCaption}
        visible={overlayVisible}
        onClose={onClose}
        onToggleCaption={() => {
          setShowCaption((prev) => !prev);
          resetIdleTimer();
        }}
      />
    </div>
  );
}
