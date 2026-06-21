import type { ReactNode } from 'react';
import Image from 'next/image';

type PhoneProps = {
  children?: ReactNode;
  scale?: number;
  /** 실제 앱 스크린샷 경로. 지정 시 가짜 상태바 없이 프레임을 이미지로 꽉 채운다. */
  screenshot?: string;
  alt?: string;
};

export function Phone({ children, scale = 1, screenshot, alt = '' }: PhoneProps) {
  const width = 230 * scale;
  const height = 468 * scale;
  const radius = 32 * scale;
  const statusBarHeight = 30 * scale;

  if (screenshot) {
    return (
      <div
        className="relative shrink-0 overflow-hidden border-[1.5px] border-stone-200 bg-stone-50"
        style={{
          width,
          height,
          borderRadius: radius,
          boxShadow: '0 20px 60px hsl(20 6% 10% / 0.15)',
        }}
      >
        <Image
          src={screenshot}
          alt={alt}
          fill
          sizes={`${Math.round(width)}px`}
          className="object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className="shrink-0 overflow-hidden border-[1.5px] border-stone-200 bg-stone-50"
      style={{
        width,
        height,
        borderRadius: radius,
        boxShadow: '0 20px 60px hsl(20 6% 10% / 0.15)',
      }}
    >
      <div
        className="flex items-center justify-between border-b border-stone-100 bg-stone-50"
        style={{ height: statusBarHeight, padding: `0 ${16 * scale}px` }}
      >
        <span className="font-semibold text-stone-700" style={{ fontSize: 9 * scale }}>
          9:41
        </span>
        <div
          className="relative rounded-[2px] border border-stone-500"
          style={{ width: 12 * scale, height: 6 * scale }}
        >
          <div className="absolute inset-y-[1px] left-[1px] w-[75%] rounded-[1px] bg-stone-600" />
        </div>
      </div>
      <div style={{ height: `calc(100% - ${statusBarHeight}px)`, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ── Compact Gallery Mock ──────────────────────────────────────────────
// 갤러리 단독 스크린샷이 아직 없어 CSS 목업을 유지한다.
export function GalleryMock() {
  const tags = ['전체', '여행', '일상', '음식'];
  const folders: Array<[string, string]> = [
    ['제주 여행', '#F9D4B0'],
    ['일상', '#D4E8F9'],
    ['결혼 준비', '#F9D4D4'],
  ];
  const photos = [
    '#F9D4B0',
    '#D4E8F9',
    '#D4F9E0',
    '#F9D4D4',
    '#E8D4F9',
    '#F9F0D4',
    '#D4F9F9',
    '#F9EAD4',
    '#D4D4F9',
  ];

  return (
    <div className="font-sans" style={{ background: 'hsl(30 20% 98%)', height: '100%' }}>
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="text-[12px] font-bold">사진</div>
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-coral-400 text-[12px] text-white">
          +
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 pb-2">
        {tags.map((t, i) => (
          <span
            key={t}
            className={
              'rounded-full px-2 py-[2px] text-[7.5px] font-medium whitespace-nowrap ' +
              (i === 0
                ? 'bg-coral-400 text-white'
                : 'border border-stone-200 bg-stone-100 text-stone-600')
            }
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mb-2 px-3">
        <div className="mb-1 text-[8px] font-semibold text-stone-600">폴더</div>
        <div className="flex gap-[5px]">
          {folders.map(([n, bg]) => (
            <div key={n} className="flex-1">
              <div className="mb-[2px] aspect-square rounded-[7px]" style={{ background: bg }} />
              <div className="text-[7px] font-semibold">{n}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3">
        <div className="mb-1 text-[8px] font-semibold text-stone-600">전체 사진</div>
        <div className="grid grid-cols-3 gap-[2px]">
          {photos.map((bg, i) => (
            <div key={i} className="aspect-square rounded-[4px]" style={{ background: bg }} />
          ))}
        </div>
      </div>
    </div>
  );
}
