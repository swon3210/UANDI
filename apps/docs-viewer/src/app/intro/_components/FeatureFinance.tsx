'use client';

import { PieChart, Users, Coins, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

const FEATURES: Array<{ icon: LucideIcon; label: string }> = [
  { icon: PieChart, label: '자산 종류별 배분 비율을 시각화' },
  { icon: Users, label: '개인 소유 + 커플 합산 자산을 분리 관리' },
  { icon: Coins, label: '예적금·투자·환테크 현황을 한 곳에' },
  { icon: Target, label: '함께 세우는 자산 목표' },
];

export function FeatureFinance() {
  const textRef = useReveal();
  const phoneRef = useReveal();

  return (
    <section className="bg-white" style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}>
      <div
        className="mx-auto flex max-w-[1100px] flex-wrap-reverse items-center justify-center"
        style={{ gap: 'clamp(40px,6vw,80px)' }}
      >
        <div ref={textRef} className="landing-fade-up flex-[1_1_300px]" style={{ maxWidth: 460 }}>
          <Tag color="sage">재테크</Tag>
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
            우리 자산,
            <br />
            한눈에 모아봐요
          </h2>
          <p
            className="mb-7 text-[15px] text-stone-600"
            style={{ lineHeight: 1.7, textWrap: 'pretty' }}
          >
            흩어진 예적금·투자·환테크를 한 곳으로. 개인 자산과 커플 합산 자산배분을 비율로 확인하고
            둘이 함께 목표를 세워요.
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
          <PhoneMockup scale={1.05} screenshot="/screenshots/allocation.png" alt="말랑 가계부 자산배분 화면" />
        </div>
      </div>
    </section>
  );
}
