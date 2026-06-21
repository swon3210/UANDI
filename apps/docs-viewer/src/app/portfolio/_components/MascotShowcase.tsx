'use client';

import Image from 'next/image';
import { SectionLabel } from './SectionLabel';
import { useReveal } from './useReveal';

const STICKERS = [
  { src: '/mascot/sticker-laugh.png', label: '웃음' },
  { src: '/mascot/sticker-wink.png', label: '윙크' },
  { src: '/mascot/sticker-neutral.png', label: '담담' },
  { src: '/mascot/sticker-surprised.png', label: '놀람' },
  { src: '/mascot/sticker-teary.png', label: '울먹' },
];

export function MascotShowcase() {
  const ref = useReveal();
  return (
    <section ref={ref} className="landing-fade-up mb-24">
      <SectionLabel>Brand Mascot</SectionLabel>
      <div className="rounded-2xl border border-stone-200 bg-white px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {/* 커플 */}
          <div className="flex shrink-0 items-end gap-1">
            <Image
              src="/mascot/couple-coral.png"
              alt="코랄 스카프 마스코트"
              width={505}
              height={600}
              className="landing-float-slow h-auto w-[104px] object-contain drop-shadow-md"
            />
            <Image
              src="/mascot/couple-sage.png"
              alt="세이지 스카프 마스코트"
              width={505}
              height={600}
              className="landing-float-slow landing-float-delay-1s h-auto w-[104px] object-contain drop-shadow-md"
            />
          </div>
          {/* 설명 */}
          <div className="flex-[1_1_320px]" style={{ maxWidth: 460 }}>
            <h3 className="mb-2 text-[18px] font-bold text-stone-900">
              직접 디자인한 브랜드 마스코트
            </h3>
            <p className="text-[13.5px] text-stone-600" style={{ lineHeight: 1.7 }}>
              코랄·세이지 스카프를 두른 기니피그 커플을 오리지널로 디자인했습니다. 생성형 이미지의
              가짜 체커보드 배경을 flood-fill 파이프라인으로 제거해, 로딩 인디케이터·빈 화면·에러 등
              상태별 일러스트와 표정 스티커를 하나의 자산 체계로 운용합니다.
            </p>
          </div>
        </div>

        {/* 표정 스티커 + 얼굴 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {STICKERS.map((s) => (
            <div
              key={s.src}
              className="flex h-16 w-16 items-center justify-center rounded-xl border border-stone-100 bg-stone-50"
            >
              <Image
                src={s.src}
                alt={s.label}
                width={302}
                height={346}
                className="h-auto w-11 object-contain"
              />
            </div>
          ))}
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-coral-100 bg-coral-50">
            <Image
              src="/mascot/face.png"
              alt="마스코트 얼굴"
              width={865}
              height={905}
              className="h-auto w-11 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
