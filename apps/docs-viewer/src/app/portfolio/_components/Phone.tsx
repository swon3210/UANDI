import type { ReactNode } from 'react';

type PhoneProps = {
  children: ReactNode;
  scale?: number;
};

export function Phone({ children, scale = 1 }: PhoneProps) {
  const width = 230 * scale;
  const height = 468 * scale;
  const radius = 32 * scale;
  const statusBarHeight = 30 * scale;

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

// ── Compact Dashboard Mock ──────────────────────────────────────────────
export function DashMock() {
  const summary: Array<[string, string, string]> = [
    ['수입', '5,200,000원', 'text-sage-400'],
    ['지출', '1,830,000원', 'text-coral-500'],
    ['잔액', '3,370,000원', 'text-stone-900'],
  ];
  const photos = ['#F9D4B0', '#D4E8F9', '#D4F9E0', '#F9D4D4', '#E8D4F9', '#F9F0D4'];
  const recent: Array<[string, string, string, boolean]> = [
    ['점심', '식비', '-9,000원', false],
    ['택시', '교통', '-15,000원', false],
    ['월급', '수입', '+3,000,000원', true],
  ];

  return (
    <div className="font-sans" style={{ background: 'hsl(30 20% 98%)', height: '100%' }}>
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div>
          <div className="text-[8px] text-stone-500">4월의 우리</div>
          <div className="text-[12px] font-bold text-stone-900">대시보드</div>
        </div>
        <div className="flex gap-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-coral-400 text-[7px] font-bold text-white">
            나
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-400 text-[7px] font-bold text-white">
            연
          </div>
        </div>
      </div>

      <div className="mx-2.5 mb-2 rounded-[10px] border border-stone-200 bg-white px-2.5 py-2">
        <div className="mb-1.5 text-[7px] text-stone-500">4월 요약</div>
        <div className="flex justify-between">
          {summary.map(([l, v, c]) => (
            <div key={l} className="text-center">
              <div className="text-[6.5px] text-stone-500">{l}</div>
              <div className={`landing-tabular text-[7.5px] font-bold ${c}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-stone-100">
          <div className="h-full w-[35%] rounded-full bg-coral-400" />
        </div>
      </div>

      <div className="mb-2 px-2.5">
        <div className="mb-1 flex justify-between">
          <span className="text-[8.5px] font-semibold">최근 사진</span>
          <span className="text-[7px] text-coral-400">모두 보기</span>
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {photos.map((bg, i) => (
            <div key={i} className="aspect-square rounded-[4px]" style={{ background: bg }} />
          ))}
        </div>
      </div>

      <div className="mx-2.5 rounded-[10px] border border-stone-200 bg-white px-2.5 py-1.5">
        <div className="mb-1 text-[8.5px] font-semibold">최근 내역</div>
        {recent.map(([l, c, a, positive], i) => (
          <div
            key={i}
            className={
              'flex items-center justify-between' +
              (i < recent.length - 1 ? ' mb-1 border-b border-stone-100 pb-1' : '')
            }
          >
            <div>
              <div className="text-[8px] font-medium">{l}</div>
              <div className="text-[6.5px] text-stone-400">{c}</div>
            </div>
            <div
              className={
                'landing-tabular text-[8px] font-semibold ' +
                (positive ? 'text-sage-400' : 'text-coral-500')
              }
            >
              {a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compact Gallery Mock ──────────────────────────────────────────────
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
