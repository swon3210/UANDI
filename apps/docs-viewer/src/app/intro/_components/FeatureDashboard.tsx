'use client';

import { PhoneMockup, DashboardMock } from './PhoneMockup';
import { Tag } from './Tag';
import { useReveal } from './useReveal';

export function FeatureDashboard() {
  const textRef = useReveal();
  const phoneRef = useReveal();

  return (
    <section style={{ padding: 'clamp(60px,10vh,120px) clamp(20px,5vw,80px)' }}>
      <div ref={textRef} className="landing-fade-up mx-auto mb-14 max-w-[1100px] text-center">
        <Tag>대시보드</Tag>
        <h2
          className="text-stone-900"
          style={{
            fontSize: 'clamp(26px,3vw,38px)',
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            textWrap: 'pretty',
          }}
        >
          로그인하면 바로 만나는
          <br />
          우리만의 홈
        </h2>
        <p
          className="mx-auto mt-4 text-[15px] text-stone-600"
          style={{ lineHeight: 1.7, maxWidth: 460, textWrap: 'pretty' }}
        >
          최근 사진과 이번 달 가계부를 한눈에. 오늘 무슨 일이 있었는지, 얼마를 썼는지 — 첫 화면에서
          바로 파악할 수 있어요.
        </p>
      </div>
      <div ref={phoneRef} className="landing-fade-up landing-fade-up-d1 flex justify-center">
        <div className="landing-float-slow landing-float-delay-500ms">
          <PhoneMockup scale={1.1}>
            <DashboardMock />
          </PhoneMockup>
        </div>
      </div>
    </section>
  );
}
