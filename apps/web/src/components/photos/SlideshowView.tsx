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
  const [showCaption, setShowCaption] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('slideshow-show-caption') === 'true';
  });
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

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, photos.length - 1));
    resetIdleTimer();
  }, [photos.length, resetIdleTimer]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    resetIdleTimer();
  }, [resetIdleTimer]);

  // 초기 타이머 설정 + 인터랙션 이벤트 리스너 + 키보드 탐색
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
          quality={90}
          priority
          data-testid="slideshow-image"
        />

        {/* 인접 이미지 프리로드 (Next.js Image 최적화 활용) */}
        {currentIndex > 0 && (
          <Image
            src={photos[currentIndex - 1].storageUrl}
            alt=""
            fill
            className="invisible"
            sizes="100vw"
            quality={90}
            priority
            aria-hidden
          />
        )}
        {photos.slice(currentIndex + 1, currentIndex + 6).map((photo) => (
          <Image
            key={photo.id}
            src={photo.storageUrl}
            alt=""
            fill
            className="invisible"
            sizes="100vw"
            quality={90}
            priority
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
        folder={folder}
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
      />
    </div>
  );
}
