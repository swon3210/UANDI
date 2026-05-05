import type { Metadata } from 'next';
import { Header } from './_components/Header';
import { Hero } from './_components/Hero';
import { TechStack } from './_components/TechStack';
import { Features } from './_components/Features';
import { KeyDecisions } from './_components/KeyDecisions';
import { Footer } from './_components/Footer';

export const metadata: Metadata = {
  title: 'UANDI — Portfolio',
  description:
    'UANDI 개발자 포트폴리오 — Next.js 14, Firebase, 모노레포 기반 신혼부부 라이프 매니지먼트 앱.',
};

export default function PortfolioPage() {
  return (
    <div
      className="mx-auto scroll-smooth"
      style={{ maxWidth: 960, padding: '0 clamp(20px,5vw,48px)' }}
    >
      <Header />
      <Hero />
      <TechStack />
      <Features />
      <KeyDecisions />
      <Footer />
    </div>
  );
}
