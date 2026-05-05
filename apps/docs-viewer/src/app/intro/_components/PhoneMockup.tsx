import type { ReactNode } from 'react';

type PhoneMockupProps = {
  children: ReactNode;
  scale?: number;
};

export function PhoneMockup({ children, scale = 1 }: PhoneMockupProps) {
  const width = 260 * scale;
  const height = 530 * scale;
  const radius = 36 * scale;
  const statusBarHeight = 36 * scale;

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

// ── Dashboard mock ──────────────────────────────────────────────────────
export function DashboardMock() {
  const photos = ['#F9D4B0', '#D4E8F9', '#D4F9E0', '#F9D4D4', '#E8D4F9', '#F9F0D4'];
  const recent = [
    { label: '점심 — 김치찌개', tag: '식비', amount: '-9,000원', positive: false },
    { label: '편의점', tag: '생활', amount: '-4,300원', positive: false },
    { label: '월급', tag: '수입', amount: '+3,000,000원', positive: true },
  ];

  return (
    <div className="font-sans" style={{ background: 'hsl(30 20% 98%)', minHeight: '100%' }}>
      <div className="flex items-center justify-between px-[14px] pt-3 pb-[10px]">
        <div>
          <div className="text-[11px] text-stone-500">좋은 아침이에요 ☀️</div>
          <div className="text-[15px] font-bold text-stone-900">우리의 4월</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-coral-400 text-[11px] font-semibold text-white">
            나
          </div>
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-sage-400 text-[11px] font-semibold text-white">
            연
          </div>
        </div>
      </div>

      <div className="mx-3 mb-[10px] rounded-xl border border-stone-200 bg-white px-[14px] py-3">
        <div className="mb-2 text-[10px] text-stone-500">4월 가계부 요약</div>
        <div className="flex justify-between">
          <div>
            <div className="text-[9px] text-stone-500">수입</div>
            <div className="landing-tabular text-[14px] font-bold text-sage-400">5,200,000원</div>
          </div>
          <div>
            <div className="text-[9px] text-stone-500">지출</div>
            <div className="landing-tabular text-[14px] font-bold text-coral-500">1,830,000원</div>
          </div>
          <div>
            <div className="text-[9px] text-stone-500">잔액</div>
            <div className="landing-tabular text-[14px] font-bold text-stone-900">3,370,000원</div>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full w-[35%] rounded-full bg-coral-400" />
        </div>
      </div>

      <div className="mb-[10px] px-3">
        <div className="mb-2 flex justify-between">
          <span className="text-[12px] font-semibold">최근 사진</span>
          <span className="text-[10px] text-coral-400">모두 보기</span>
        </div>
        <div className="grid grid-cols-3 gap-[3px]">
          {photos.map((bg, i) => (
            <div key={i} className="aspect-square rounded-md" style={{ background: bg }} />
          ))}
        </div>
      </div>

      <div className="mx-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5">
        <div className="mb-2 text-[12px] font-semibold">최근 내역</div>
        {recent.map((row, i) => (
          <div
            key={i}
            className={
              'flex items-center justify-between' +
              (i < recent.length - 1 ? ' mb-1.5 border-b border-stone-100 pb-1.5' : '')
            }
          >
            <div>
              <div className="text-[11px] font-medium">{row.label}</div>
              <div className="mt-px text-[9px] text-stone-500">{row.tag}</div>
            </div>
            <div
              className={
                'landing-tabular text-[11px] font-semibold ' +
                (row.positive ? 'text-sage-400' : 'text-coral-500')
              }
            >
              {row.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gallery mock ──────────────────────────────────────────────────────
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

// ── Cashbook mock ──────────────────────────────────────────────────────
export function CashbookMock() {
  const items = [
    { label: '점심 — 김치찌개', cat: '식비', amt: '-9,000원', positive: false, who: '나' },
    { label: '택시', cat: '교통', amt: '-15,000원', positive: false, who: '연' },
    { label: '마트 장보기', cat: '생활', amt: '-67,000원', positive: false, who: '나' },
    { label: '카페 라떼', cat: '카페', amt: '-6,500원', positive: false, who: '연' },
    { label: '4월 월급', cat: '수입', amt: '+3,000,000원', positive: true, who: '나' },
  ];
  const summary: Array<[string, string, string]> = [
    ['수입', '5,200,000원', 'text-sage-400'],
    ['지출', '1,830,000원', 'text-coral-500'],
    ['잔액', '3,370,000원', 'text-stone-900'],
  ];
  const cats: Array<[string, number]> = [
    ['식비', 38],
    ['교통', 18],
    ['생활', 30],
    ['카페', 14],
  ];

  return (
    <div className="font-sans" style={{ background: 'hsl(30 20% 98%)', minHeight: '100%' }}>
      <div className="flex items-center justify-between px-[14px] pt-3 pb-2">
        <div className="text-[16px] font-bold">가계부</div>
        <div className="text-[12px] font-semibold text-stone-800">2026년 4월</div>
      </div>

      <div className="mx-3 mb-2.5 rounded-xl border border-stone-200 bg-white px-[14px] py-3">
        <div className="grid grid-cols-3 gap-1 text-center">
          {summary.map(([l, v, c]) => (
            <div key={l}>
              <div className="text-[9px] text-stone-500">{l}</div>
              <div className={`landing-tabular text-[10px] font-bold ${c}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5">
          {cats.map(([cat, pct]) => (
            <div key={cat} className="mb-1 flex items-center gap-1.5">
              <div className="w-6 shrink-0 text-[9px] text-stone-600">{cat}</div>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-coral-300" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-[18px] text-[9px] text-stone-500">{pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-3 mb-2.5 rounded-[10px] border border-coral-100 bg-coral-50 px-3 py-2">
        <div className="mb-1 text-[9px] text-coral-600">자연어로 입력하기</div>
        <div className="text-[10px] italic text-stone-700">
          &quot;점심 김치찌개 9천원, 어제 택시 15000원&quot;
        </div>
      </div>

      <div className="mx-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
        {items.map((r, i) => (
          <div
            key={i}
            className={
              'flex items-center gap-2' +
              (i < items.length - 1 ? ' mb-1.5 border-b border-stone-100 pb-1.5' : '')
            }
          >
            <div
              className={
                'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white ' +
                (r.who === '나' ? 'bg-coral-400' : 'bg-sage-400')
              }
            >
              {r.who}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-medium">{r.label}</div>
              <div className="text-[8px] text-stone-400">{r.cat}</div>
            </div>
            <div
              className={
                'landing-tabular text-[10px] font-semibold ' +
                (r.positive ? 'text-sage-400' : 'text-coral-500')
              }
            >
              {r.amt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
