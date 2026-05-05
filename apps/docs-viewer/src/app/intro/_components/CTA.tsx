'use client';

import { Logo } from '@uandi/ui';
import { GoogleIcon } from './GoogleIcon';
import { useReveal } from './useReveal';

export function CTA() {
  const ref = useReveal();
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-stone-50"
      style={{ padding: 'clamp(80px,12vh,140px) clamp(20px,5vw,80px)' }}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full bg-coral-50 opacity-70"
          style={{
            width: 'min(60vw, 800px)',
            height: 'min(60vw, 800px)',
            filter: 'blur(100px)',
          }}
        />
      </div>
      <div ref={ref} className="landing-fade-up relative mx-auto max-w-[560px] text-center">
        <div className="flex justify-center">
          <Logo variant="icon" width={64} height={64} />
        </div>
        <h2
          className="mt-5 mb-4 text-stone-900"
          style={{
            fontSize: 'clamp(28px,4vw,46px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textWrap: 'pretty',
          }}
        >
          지금 시작해보세요
        </h2>
        <p
          className="mb-9 text-[16px] text-stone-600"
          style={{ lineHeight: 1.7, textWrap: 'pretty' }}
        >
          초대 코드로 파트너와 연결하면 바로 사용할 수 있어요.
          <br />
          우리 둘만의 공간이 기다리고 있어요.
        </p>
        <a
          href="https://uandi-web.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-2xl bg-coral-400 px-9 py-4 text-[17px] font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-coral-500"
          style={{ boxShadow: '0 4px 24px hsl(4 74% 69% / 0.35)' }}
        >
          <GoogleIcon size={20} />
          구글로 시작하기
        </a>
        <p className="mt-4 text-[12px] text-stone-400">무료 · 광고 없음 · 완전 프라이빗</p>
      </div>
    </section>
  );
}
