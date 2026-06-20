import { cn } from '@uandi/ui/lib/utils';

export type MascotLoaderProps = {
  /** 정적 마스코트 이미지 경로 (예: '/brand/mascot-loading.png'). 애니메이션은 점이 담당한다. */
  src: string;
  /** 스크린리더 안내 문구 (기본: '로딩 중') */
  label?: string;
  /** 점 아래에 보이는 텍스트 (선택) */
  caption?: string;
  /** 마스코트 이미지 한 변 크기(px). 기본 96 */
  imageSize?: number;
  /** 전체 화면 중앙 정렬로 감싼다 (FullScreenSpinner 대체용). 기본 false */
  fullScreen?: boolean;
  className?: string;
};

const DOT_COUNT = 3;

/**
 * 정적 마스코트 + 바운싱 점 3개 로딩 인디케이터.
 *
 * - 마스코트 PNG는 움직이지 않고, "움직이는 요소"는 아래 점 3개가 담당한다.
 * - 점 애니메이션은 `motion-safe:` 라서 `prefers-reduced-motion: reduce` 사용자에겐 정지 상태로 보인다.
 * - `fullScreen` 으로 `<FullScreenSpinner />` 자리에 1:1 대체 가능: `<MascotLoader src="..." fullScreen />`
 */
export function MascotLoader({
  src,
  label = '로딩 중',
  caption,
  imageSize = 96,
  fullScreen = false,
  className,
}: MascotLoaderProps) {
  const loader = (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center gap-4', !fullScreen && className)}
    >
      {/* 정적 마스코트 (장식 — 의미는 role=status 라벨이 전달) */}
      <img
        src={src}
        alt=""
        width={imageSize}
        height={imageSize}
        draggable={false}
        className="select-none object-contain motion-safe:animate-mascot-bob"
        style={{ width: imageSize, height: imageSize }}
      />

      {/* 움직이는 요소: 바운싱 점 3개 (reduced-motion 시 정지) */}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-2 rounded-full motion-safe:animate-bounce',
              i === 1 ? 'bg-sage-400' : 'bg-coral-400'
            )}
            style={{ animationDelay: `${(-0.32 + i * 0.16).toFixed(2)}s` }}
          />
        ))}
      </div>

      {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', className)}>{loader}</div>
    );
  }

  return loader;
}
