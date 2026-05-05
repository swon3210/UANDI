'use client';

import { Image as ImageIcon, Mic, Sparkles, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneMockup, CashbookMock } from './PhoneMockup';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

const FEATURES: Array<{ icon: LucideIcon; label: string }> = [
  { icon: ImageIcon, label: '영수증 사진 캡처 한 장으로 금액·항목 자동 인식' },
  { icon: Mic, label: '자연어 입력 — 여러 건을 한 문장으로 동시 등록' },
  { icon: Sparkles, label: 'AI 소비 패턴 분석 및 맞춤 절약 조언' },
  { icon: BarChart3, label: '수입 / 지출 / 투자 / 플렉스 카테고리 통계' },
];

export function FeatureCashbook() {
  const textRef = useReveal();
  const phoneRef = useReveal();

  return (
    <section
      className="bg-white"
      style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}
    >
      <div
        className="mx-auto flex max-w-[1100px] flex-wrap-reverse items-center justify-center"
        style={{ gap: 'clamp(40px,6vw,80px)' }}
      >
        <div ref={textRef} className="landing-fade-up flex-[1_1_300px]" style={{ maxWidth: 460 }}>
          <Tag color="sage">함께 쓰는 가계부</Tag>
          <h2
            className="mb-4 text-stone-900"
            style={{
              fontSize: 'clamp(26px,3vw,38px)',
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              textWrap: 'pretty',
            }}
          >
            영수증 캡처 한 번으로
            <br />
            내역이 완성돼요
          </h2>
          <p
            className="mb-7 text-[15px] text-stone-600"
            style={{ lineHeight: 1.7, textWrap: 'pretty' }}
          >
            엑셀에 직접 입력하거나 카드 문자를 복붙하던 시간은 끝. 영수증을 찍거나 &ldquo;점심
            9천원, 어제 택시 15000원&rdquo; 하고 말하듯 쓰면 AI가 알아서 분류하고 등록해요.
          </p>
          <ul className="flex flex-col gap-2.5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.label} className="flex items-start gap-2.5">
                  <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sage-50 text-sage-400">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                  <span className="pt-[5px] text-[14px] text-stone-700" style={{ lineHeight: 1.5 }}>
                    {f.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div
          ref={phoneRef}
          className="landing-fade-up landing-fade-up-d1 landing-float-slow landing-float-delay-1500ms"
        >
          <PhoneMockup scale={1.05}>
            <CashbookMock />
          </PhoneMockup>
        </div>
      </div>
    </section>
  );
}
