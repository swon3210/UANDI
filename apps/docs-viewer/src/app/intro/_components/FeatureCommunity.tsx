'use client';

import { MessageCircle, Sparkles, Search, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneMockup } from './PhoneMockup';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

const FEATURES: Array<{ icon: LucideIcon; label: string }> = [
  { icon: MessageCircle, label: '신혼부부끼리 나누는 정보·후기' },
  { icon: Sparkles, label: '유용한 외부 글까지 한데 모아' },
  { icon: Search, label: '주제별로 빠르게 찾기' },
  { icon: Heart, label: '같은 시기를 보내는 사람들과 공감' },
];

export function FeatureCommunity() {
  const phoneRef = useReveal();
  const textRef = useReveal();

  return (
    <section style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}>
      <div
        className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center"
        style={{ gap: 'clamp(40px,6vw,80px)' }}
      >
        <div ref={phoneRef} className="landing-fade-up landing-float-slow">
          <PhoneMockup scale={1.05} screenshot="/screenshots/community.png" alt="MOA 커뮤니티 화면" />
        </div>
        <div
          ref={textRef}
          className="landing-fade-up landing-fade-up-d1 flex-[1_1_300px]"
          style={{ maxWidth: 460 }}
        >
          <Tag color="coral">커뮤니티</Tag>
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
            신혼 고민,
            <br />
            먼저 겪은 부부들과
          </h2>
          <p
            className="mb-7 text-[15px] text-stone-600"
            style={{ lineHeight: 1.7, textWrap: 'pretty' }}
          >
            집·살림·재테크까지 — 신혼부부끼리 정보와 후기를 나누는 공간. 혼자 검색만 하던 고민을 같은
            시기를 보내는 사람들과 함께 풀어요.
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
