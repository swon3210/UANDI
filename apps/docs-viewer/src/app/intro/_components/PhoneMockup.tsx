import type { ReactNode } from 'react';
import Image from 'next/image';

type PhoneMockupProps = {
  children?: ReactNode;
  scale?: number;
  /** 실제 앱 스크린샷 경로. 지정 시 가짜 상태바 없이 프레임을 이미지로 꽉 채운다. */
  screenshot?: string;
  alt?: string;
};

export function PhoneMockup({ children, scale = 1, screenshot, alt = '' }: PhoneMockupProps) {
  const width = 260 * scale;
  const height = 530 * scale;
  const radius = 36 * scale;
  const statusBarHeight = 36 * scale;

  // 실제 스크린샷 모드 — 자체 상태바를 포함하므로 풀블리드로 렌더
  if (screenshot) {
    return (
      <div
        className="relative shrink-0 overflow-hidden border-[1.5px] border-stone-200 bg-stone-50"
        style={{
          width,
          height,
          borderRadius: radius,
          boxShadow: '0 24px 80px hsl(20 6% 10% / 0.18)',
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
      className="relative shrink-0 overflow-hidden border-[1.5px] border-stone-200 bg-stone-50"
      style={{
        width,
        height,
        borderRadius: radius,
        boxShadow: '0 24px 80px hsl(20 6% 10% / 0.18)',
      }}
    >
      {/* status bar */}
      <div
        className="flex items-center justify-between border-b border-stone-100 bg-stone-50"
        style={{ height: statusBarHeight, padding: `0 ${18 * scale}px` }}
      >
        <span className="font-semibold text-stone-700" style={{ fontSize: 10 * scale }}>
          9:41
        </span>
        <div className="flex items-center" style={{ gap: 4 * scale }}>
          <div
            className="relative rounded-[2px] border border-stone-600"
            style={{ width: 14 * scale, height: 7 * scale }}
          >
            <div className="absolute inset-y-[1px] left-[1px] w-[80%] rounded-[1px] bg-stone-700" />
            <div className="absolute right-[-3px] top-1/4 bottom-1/4 w-[2px] rounded-[1px] bg-stone-500" />
          </div>
        </div>
      </div>

      {/* content — scaled */}
      <div
        style={{
          height: `calc(100% - ${statusBarHeight}px)`,
          width: `${100 / scale}%`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Gallery mock ──────────────────────────────────────────────────────
// 갤러리 단독 스크린샷이 아직 없어 CSS 목업을 유지한다. (추후 e2e 캡처로 교체 가능)
export function GalleryMock() {
  const folders = [
    { name: '제주 여행', count: 47, bg: '#F9D4B0' },
    { name: '일상', count: 132, bg: '#D4E8F9' },
    { name: '결혼 준비', count: 28, bg: '#F9D4D4' },
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
  const tags = ['전체', '여행', '일상', '음식', '기념일'];

  return (
    <div className="font-sans" style={{ background: 'hsl(30 20% 98%)', minHeight: '100%' }}>
      <div className="flex items-center justify-between px-[14px] pt-3 pb-2">
        <div className="text-[16px] font-bold">사진</div>
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-coral-400 text-[14px] text-white">
          +
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-[14px] pb-2.5">
        {tags.map((t, i) => (
          <span
            key={t}
            className={
              'rounded-full px-2.5 py-[3px] text-[10px] font-medium whitespace-nowrap ' +
              (i === 0
                ? 'bg-coral-400 text-white'
                : 'border border-stone-200 bg-stone-100 text-stone-600')
            }
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mb-2.5 px-[14px]">
        <div className="mb-1.5 text-[11px] font-semibold text-stone-600">폴더</div>
        <div className="flex gap-2">
          {folders.map((f) => (
            <div key={f.name} className="flex-1">
              <div className="mb-1 aspect-square rounded-[10px]" style={{ background: f.bg }} />
              <div className="text-[10px] font-semibold text-stone-800">{f.name}</div>
              <div className="text-[9px] text-stone-400">{f.count}장</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-[14px]">
        <div className="mb-1.5 text-[11px] font-semibold text-stone-600">전체 사진</div>
        <div className="grid grid-cols-3 gap-[3px]">
          {photos.map((bg, i) => (
            <div key={i} className="relative aspect-square rounded-md" style={{ background: bg }}>
              {i === 0 && (
                <div className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-coral-400">
                  <div className="h-2 w-2 rounded-full border-[1.5px] border-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
