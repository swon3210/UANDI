import type { Metadata } from 'next';
import { Nav } from './_components/Nav';
import { Hero } from './_components/Hero';
import { Values } from './_components/Values';
import { FeatureGallery } from './_components/FeatureGallery';
import { FeatureCashbook } from './_components/FeatureCashbook';
import { FeatureDashboard } from './_components/FeatureDashboard';
import { Diff } from './_components/Diff';
import { CTA } from './_components/CTA';
import { Footer } from './_components/Footer';

export const metadata: Metadata = {
  title: 'UANDI — 둘이서 만드는 우리만의 일상',
  description:
    '신혼부부의 가정생활을 UANDI 하나로. 사진, 가계부, 추억까지 — 우리 둘만의 프라이빗 공간에서 함께 관리해요.',
};

export default function IntroPage() {
  return (
    <div className="scroll-smooth overflow-x-hidden">
      <Nav />
      <Hero />
      <Values />
      <FeatureGallery />
      <FeatureCashbook />
      <FeatureDashboard />
      <Diff />
      <CTA />
      <Footer />
    </div>
  );
}
