'use client';

import { CalendarDays, TrendingUp, Banknote, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

const FEATURES: Array<{ icon: LucideIcon; label: string }> = [
  { icon: CalendarDays, label: '월급·고정지출을 반영한 잔액 달력' },
  { icon: TrendingUp, label: '다가올 월급날 예상 잔액 미리보기' },
  { icon: Banknote, label: '지출이 몰리는 날을 미리 파악' },
  { icon: Wallet, label: '이번 달 남은 예산을 한눈에' },
];

export function FeatureCashflow() {
  const phoneRef = useReveal();
  const textRef = useReveal();

  return (
    <section style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}>
      <div
        className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center"
        style={{ gap: 'clamp(40px,6vw,80px)' }}
      >
        <div ref={phoneRef} className="landing-fade-up landing-float-slow">
          <PhoneMockup scale={1.05} screenshot="/screenshots/cashflow.png" alt="말랑 가계부 현금흐름 달력 화면" />
        </div>
        <div
          ref={textRef}
          className="landing-fade-up landing-fade-up-d1 flex-[1_1_300px]"
          style={{ maxWidth: 460 }}
        >
          <Tag color="coral">현금흐름</Tag>
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
            월급날의 잔액까지
            <br />
            미리 보여드려요
          </h2>
          <p
            className="mb-7 text-[15px] text-stone-600"
            style={{ lineHeight: 1.7, textWrap: 'pretty' }}
          >
            고정 수입·지출을 반영한 잔액 흐름을 달력으로. 다가올 월급날과 카드값에 통장이 어떻게
            변할지 미리 확인해요.
          </p>
          <ul className="flex flex-col gap-2.5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.label} className="flex items-start gap-2.5">
                  <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-coral-50 text-coral-400">
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
      </div>
    </section>
  );
}
