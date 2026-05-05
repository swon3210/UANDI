'use client';

import { Check } from 'lucide-react';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

const ROWS = [
  { q: '사진 앱·가계부 앱·메모 앱을 따로 써야 해요', a: 'UANDI 하나로 모두 통합됩니다' },
  { q: '가계부 입력이 귀찮아 며칠씩 미루게 돼요', a: '영수증 캡처 한 장으로 즉시 등록돼요' },
  { q: '우리가 어디에 얼마나 쓰는지 파악이 안 돼요', a: 'AI가 소비 패턴을 분석해 리포트로 드려요' },
  { q: '절약하고 싶은데 어디서부터 시작할지 몰라요', a: '항목별 통계와 맞춤 절약 조언을 제공해요' },
  {
    q: '사진이 각자 폰에만 있어 함께 보기 어려워요',
    a: '공유 갤러리에서 AI 자동 태깅으로 정리돼요',
  },
];

function Row({ q, a, i }: { q: string; a: string; i: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`landing-fade-up landing-fade-up-d${(i % 4) + 1} grid items-center gap-4 py-5 ${
        i < ROWS.length - 1 ? 'border-b border-stone-800' : ''
      }`}
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      <div className="text-right text-[14px] text-stone-400" style={{ lineHeight: 1.5 }}>
        {q}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-400">
        <Check className="h-4 w-4 text-white" strokeWidth={2.2} />
      </div>
      <div className="text-[15px] font-medium text-white" style={{ lineHeight: 1.5 }}>
        {a}
      </div>
    </div>
  );
}

export function Diff() {
  const headRef = useReveal();
  return (
    <section
      className="bg-stone-900"
      style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}
    >
      <div className="mx-auto max-w-[800px]">
        <div
          ref={headRef}
          className="landing-fade-up mb-13 text-center"
          style={{ marginBottom: 52 }}
        >
          <Tag color="coral-light">차별점</Tag>
          <h2
            className="text-white"
            style={{
              fontSize: 'clamp(26px,3vw,38px)',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
            }}
          >
            체계적으로, 간편하게.
            <br />
            AI가 함께 관리해요
          </h2>
        </div>
        <div className="flex flex-col">
          {ROWS.map((r, i) => (
            <Row key={r.q} q={r.q} a={r.a} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
