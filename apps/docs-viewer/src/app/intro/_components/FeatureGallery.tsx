'use client';

import { Folder, Play, Sparkles, Tag as TagIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhoneMockup, GalleryMock } from './PhoneMockup';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

const FEATURES: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Folder, label: '폴더·태그로 정리하는 우리만의 앨범' },
  { icon: Play, label: '폴더·태그 단위 슬라이드쇼로 추억 재감상' },
  { icon: Sparkles, label: 'AI 자동 태깅으로 정리 부담 최소화' },
  { icon: TagIcon, label: '업로더 뱃지 — 누가 올렸는지 한눈에' },
];

export function FeatureGallery() {
  const phoneRef = useReveal();
  const textRef = useReveal();

  return (
    <section id="features" style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}>
      <div
        className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center"
        style={{ gap: 'clamp(40px,6vw,80px)' }}
      >
        <div ref={phoneRef} className="landing-fade-up landing-float-slow">
          <PhoneMockup scale={1.05}>
            <GalleryMock />
          </PhoneMockup>
        </div>
        <div
          ref={textRef}
          className="landing-fade-up landing-fade-up-d1 flex-[1_1_300px]"
          style={{ maxWidth: 460 }}
        >
          <Tag color="coral">사진 갤러리</Tag>
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
            우리 둘만의
            <br />
            앨범을 만들어요
          </h2>
          <p
            className="mb-7 text-[15px] text-stone-600"
            style={{ lineHeight: 1.7, textWrap: 'pretty' }}
          >
            클라우드에 흩어진 사진들을 한 곳으로. 폴더와 태그로 정리하고, AI가 자동으로 분류해
            추억을 찾는 수고를 덜어드려요.
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
