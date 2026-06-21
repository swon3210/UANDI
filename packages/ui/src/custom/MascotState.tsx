import type { ReactNode } from 'react';
import { cn } from '@uandi/ui/lib/utils';

export type MascotStateProps = {
  /** 마스코트 이미지 경로 (빈 화면/에러/성공/유휴 등 상태별 일러스트) */
  src: string;
  /** 스크린리더용 대체 텍스트. 보통 title이 의미를 전달하므로 기본 빈 값(장식) */
  alt?: string;
  title?: string;
  description?: string;
  /** 버튼 등 액션 영역 */
  action?: ReactNode;
  /** 마스코트 이미지 한 변 크기(px). 기본 120 */
  imageSize?: number;
  className?: string;
};

/**
 * 마스코트 일러스트 + 메시지로 구성하는 상태 화면.
 *
 * 빈 화면 / 에러 / 성공 / 유휴 등 "로딩이 아닌" 상태에 사용한다.
 * (로딩 인디케이터는 `MascotLoader`, 아이콘 기반 빈 상태는 `EmptyState`.)
 */
export function MascotState({
  src,
  alt = '',
  title,
  description,
  action,
  imageSize = 120,
  className,
}: MascotStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}
    >
      <img
        src={src}
        alt={alt}
        width={imageSize}
        height={imageSize}
        draggable={false}
        className="select-none object-contain"
        style={{ width: imageSize, height: imageSize }}
      />
      {title ? <p className="mt-4 text-base font-semibold text-foreground">{title}</p> : null}
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
