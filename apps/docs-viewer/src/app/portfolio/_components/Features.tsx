'use client';

import type { ReactNode } from 'react';
import { Phone, GalleryMock } from './Phone';
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
        mockup={<Phone screenshot="/screenshots/cashbook.png" alt="MOA 가계부 화면" />}
      />
      <FeatureRow
        tag="현금흐름"
        tagAccent="coral"
        title="월급날 잔액까지 미리 예측"
        desc="고정 수입·지출을 반영해 통장 잔액 흐름을 달력으로 시뮬레이션. 다가올 월급날과 카드값 시점의 잔액을 미리 보여줍니다."
        bullets={[
          '반복 수입·지출 규칙 기반 잔액 프로젝션',
          '월급날·결제일 단위 예상 잔액 캘린더',
          '지출이 몰리는 날을 사전에 경고',
          'dayjs 기반 날짜 연산 — date-fns 미사용',
        ]}
        mockup={<Phone screenshot="/screenshots/cashflow.png" alt="MOA 현금흐름 달력 화면" />}
      />
      <FeatureRow
        reverse
        tag="재테크"
        tagAccent="sage"
        title="개인 + 커플 자산을 한눈에"
        desc="우리집(공동)과 재테크(개인 소유)를 분리한 소유 모델. 예적금·투자·환테크를 모아 개인 자산과 커플 합산 배분을 함께 봅니다."
        bullets={[
          '개인 소유 + 커플 합산 이중 집계 모델',
          '자산 종류별 배분 비율 시각화',
          '환테크(외화) 자산 통합 관리',
          '우리집 / 재테크 공간 분리 (소유권 격리)',
        ]}
        mockup={<Phone screenshot="/screenshots/allocation.png" alt="MOA 자산배분 화면" />}
      />
      <FeatureRow
        tag="커뮤니티"
        tagAccent="coral"
        title="커플을 넘어, 신혼부부끼리"
        desc="UANDI의 첫 전역(비커플) 공간. 유저 글과 외부 정보 큐레이션을 함께 다루며, 메타데이터 + 링크아웃으로 법적 가드레일을 둔 설계입니다."
        bullets={[
          '커플 격리 밖 첫 전역 Firestore 컬렉션',
          '유저 작성 글 + 외부 콘텐츠 큐레이션 혼합',
          '저작권 가드레일 — 메타데이터만 저장 + 링크아웃',
          '주제별 탐색 / 공감 인터랙션',
        ]}
        mockup={<Phone screenshot="/screenshots/community.png" alt="MOA 커뮤니티 화면" />}
      />
    </section>
  );
}
