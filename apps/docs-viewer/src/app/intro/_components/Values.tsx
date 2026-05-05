'use client';

import { Lock, Image as ImageIcon, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

type Value = {
  icon: LucideIcon;
  title: string;
  desc: string;
  iconBg: string;
  iconColor: string;
};

const VALUES: Value[] = [
  {
    icon: Lock,
    title: '완전히 프라이빗한 공간',
    desc: '초대 코드로 연결된 1:1 전용 공간. 우리 둘의 사진, 대화, 지출 내역은 오직 우리만 볼 수 있어요.',
    iconBg: 'bg-coral-50',
    iconColor: 'text-coral-400',
  },
  {
    icon: ImageIcon,
    title: '사진으로 기록하는 우리',
    desc: '데이트, 여행, 소소한 일상까지 — 폴더와 태그로 체계적으로 관리하고, AI가 자동으로 분류해드려요.',
    iconBg: 'bg-coral-50',
    iconColor: 'text-coral-400',
  },
  {
    icon: BookOpen,
    title: '가계부, 이제 제대로',
    desc: '자연어 입력과 영수증 캡처로 기록 부담을 없애고, AI가 우리 커플의 소비 패턴을 분석해 절약 조언까지 드려요.',
    iconBg: 'bg-sage-50',
    iconColor: 'text-sage-400',
  },
];

export function Values() {
  const headRef = useReveal();
  const card1 = useReveal();
  const card2 = useReveal();
  const card3 = useReveal();
  const cards = [card1, card2, card3];

  return (
    <section
      className="border-y border-stone-200 bg-white"
      style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-14 text-center">
          <div ref={headRef} className="landing-fade-up">
            <Tag>핵심 가치</Tag>
            <h2
              className="text-stone-900"
              style={{
                fontSize: 'clamp(28px,3.5vw,40px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              왜 UANDI인가요?
            </h2>
          </div>
        </div>

        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
        >
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                ref={cards[i]}
                className={`landing-fade-up landing-fade-up-d${i + 1}`}
              >
                <div className="h-full rounded-2xl border border-stone-200 bg-stone-50 p-6 pt-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${v.iconBg} ${v.iconColor}`}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                  </div>
                  <h3 className="mb-2 text-[18px] font-bold text-stone-900">{v.title}</h3>
                  <p
                    className="text-[14px] text-stone-600"
                    style={{ lineHeight: 1.65, textWrap: 'pretty' }}
                  >
                    {v.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
