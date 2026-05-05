'use client';

import type { ReactNode } from 'react';
import { Phone, GalleryMock, DashMock } from './Phone';
import { useReveal } from './useReveal';

type FeatureRowProps = {
  tag: string;
  tagAccent: 'coral' | 'sage';
  title: ReactNode;
  desc: string;
  bullets: string[];
  mockup: ReactNode;
  reverse?: boolean;
};

const ACCENT: Record<
  FeatureRowProps['tagAccent'],
  { text: string; bg: string; border: string; bullet: string }
> = {
  coral: {
    text: 'text-coral-400',
    bg: 'bg-coral-50',
    border: 'border-coral-100',
    bullet: 'bg-coral-400',
  },
  sage: {
    text: 'text-sage-400',
    bg: 'bg-sage-50',
    border: 'border-sage-100',
    bullet: 'bg-sage-400',
  },
};

function FeatureRow({ tag, tagAccent, title, desc, bullets, mockup, reverse }: FeatureRowProps) {
  const ref = useReveal();
  const accent = ACCENT[tagAccent];

  return (
    <div
      ref={ref}
      className={`landing-fade-up flex items-center justify-center ${
        reverse ? 'flex-wrap-reverse' : 'flex-wrap'
      }`}
      style={{ gap: 'clamp(32px,5vw,72px)' }}
    >
      {!reverse && <div className="landing-float-slow">{mockup}</div>}
      <div className="flex-[1_1_280px]" style={{ maxWidth: 420 }}>
        <span
          className={`mb-3 inline-block rounded-full border px-3 py-[3px] text-[11px] font-semibold ${accent.text} ${accent.bg} ${accent.border}`}
        >
          {tag}
        </span>
        <h3
          className="mb-2.5 text-stone-900"
          style={{
            fontSize: 'clamp(20px,2.5vw,28px)',
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            textWrap: 'pretty',
          }}
        >
          {title}
        </h3>
        <p
          className="mb-4 text-[14px] text-stone-600"
          style={{ lineHeight: 1.7, textWrap: 'pretty' }}
        >
          {desc}
        </p>
        <ul className="flex flex-col gap-[7px]">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className={`mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full ${accent.bullet}`} />
              <span className="text-[13px] text-stone-700" style={{ lineHeight: 1.55 }}>
                {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {reverse && <div className="landing-float-slow landing-float-delay-1s">{mockup}</div>}
    </div>
  );
}

export function Features() {
  return (
    <section className="mb-24 flex flex-col" style={{ gap: 80 }}>
      <FeatureRow
        tag="사진 갤러리"
        tagAccent="coral"
        title="우리 둘만의 앨범, 체계적으로"
        desc="클라우드에 흩어진 사진을 하나의 공간으로. AI 자동 태깅과 폴더·태그 구조로 수백 장의 사진도 쉽게 탐색합니다."
        bullets={[
          '폴더·태그 기반 계층 구조 — Firestore 컬렉션 설계',
          'AI 이미지 분석으로 장소·상황 자동 태깅',
          '업로더 식별 뱃지 (나 / 파트너) 실시간 표시',
          '폴더·태그 단위 슬라이드쇼 재생 모드',
        ]}
        mockup={
          <Phone>
            <GalleryMock />
          </Phone>
        }
      />
      <FeatureRow
        reverse
        tag="가계부"
        tagAccent="sage"
        title="영수증 한 장으로 끝나는 기록"
        desc="직접 입력 없이 영수증 사진 한 장으로 금액·항목이 자동 인식됩니다. 자연어로 여러 건을 한 번에 등록할 수도 있어요."
        bullets={[
          '영수증 OCR — 촬영 즉시 금액·카테고리 자동 인식',
          '자연어 파싱 — "점심 9천원, 어제 택시 15000원" 일괄 등록',
          'AI 소비 패턴 분석 + 커플 맞춤 절약 조언',
          '수입 / 지출 / 투자 / 플렉스 4-카테고리 월별 통계',
        ]}
        mockup={
          <Phone>
            <DashMock />
          </Phone>
        }
      />
    </section>
  );
}
