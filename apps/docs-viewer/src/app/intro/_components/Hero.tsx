import { Logo } from '@uandi/ui';
import { ArrowRight } from 'lucide-react';
import { PhoneMockup, DashboardMock, GalleryMock } from './PhoneMockup';
import { GoogleIcon } from './GoogleIcon';

export function Hero() {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50"
      style={{ padding: '80px clamp(20px,5vw,80px) 60px' }}
    >
      {/* background blurs */}
      <div
        className="pointer-events-none absolute rounded-full bg-coral-50 opacity-80"
        style={{
          top: '10%',
          right: '-5%',
          width: 'min(40vw, 600px)',
          height: 'min(40vw, 600px)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full bg-sage-50 opacity-60"
        style={{
          bottom: '5%',
          left: '-5%',
          width: 'min(30vw, 400px)',
          height: 'min(30vw, 400px)',
          filter: 'blur(60px)',
        }}
      />

      <div className="flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-12">
        {/* left: copy */}
        <div className="flex-[1_1_360px]" style={{ maxWidth: 520 }}>
          <Logo variant="icon" width={52} height={52} />
          <h1
            className="mt-4 mb-5 text-stone-900"
            style={{
              fontSize: 'clamp(36px, 5vw, 58px)',
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              textWrap: 'pretty',
            }}
          >
            우리 가정의 모든 것,
            <br />
            <span className="text-coral-400">하나로 관리해요</span>
          </h1>
          <p
            className="mb-9 text-stone-600"
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              lineHeight: 1.7,
              textWrap: 'pretty',
            }}
          >
            데이트 기록부터 추억 사진, 매달 씀씀이까지.
            <br />
            신혼부부의 가정생활을 UANDI 하나로 책임져요.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://uandi-web.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-coral-400 px-7 py-3.5 text-[16px] font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-coral-500"
            >
              <GoogleIcon size={16} />
              구글로 시작하기
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-transparent px-6 py-3.5 text-[16px] font-medium text-stone-700 transition-colors duration-150 hover:bg-stone-100"
            >
              기능 살펴보기
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-5 text-[12px] text-stone-400">
            초대 코드로 파트너와 연결 — 완전히 프라이빗
          </p>
        </div>

        {/* right: stacked phones */}
        <div className="flex flex-[1_1_300px] items-center justify-center">
          <div className="relative" style={{ width: 300, height: 530 }}>
            {/* back phone */}
            <div
              className="landing-float landing-float-delay-1s absolute"
              style={{ top: 20, right: -30 }}
            >
              <PhoneMockup scale={0.88}>
                <GalleryMock />
              </PhoneMockup>
            </div>
            {/* front phone */}
            <div className="landing-float absolute" style={{ top: 0, left: -20 }}>
              <PhoneMockup>
                <DashboardMock />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
