'use client';

import { Github, ExternalLink } from 'lucide-react';
import { Phone, GalleryMock, DashMock } from './Phone';
import { useReveal } from './useReveal';

const REPO_URL = 'https://github.com/swon3210/UANDI';
const DEMO_URL = 'https://uandi-web.vercel.app';

export function Hero() {
  const ref = useReveal();

  return (
    <section
      ref={ref}
      className="landing-fade-up mb-24 flex flex-wrap items-center justify-between"
      style={{ gap: 'clamp(32px,5vw,64px)' }}
    >
      <div className="flex-[1_1_300px]" style={{ maxWidth: 480 }}>
        <div
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-coral-100 bg-coral-50 px-3 py-1 text-[11.5px] font-semibold text-coral-500"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Personal Project · 2025–2026
        </div>
        <h1
          className="mb-4 text-stone-900"
          style={{
            fontSize: 'clamp(30px,4.5vw,52px)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            textWrap: 'pretty',
          }}
        >
          신혼부부를 위한
          <br />
          <span className="text-coral-400">프라이빗 라이프</span>
          <br />
          매니지먼트 앱
        </h1>
        <p
          className="mb-7 text-[15px] text-stone-600"
          style={{ lineHeight: 1.75, textWrap: 'pretty' }}
        >
          사진 갤러리 + 가계부를 하나로 통합한 커플 전용 웹앱. 초대 코드 기반 1:1 페어링, AI 자동
          분류·분석, 자연어 입력을 Next.js 14 + Firebase로 구현했습니다.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-stone-900 px-5 py-2.5 text-[13.5px] font-medium text-white transition-opacity duration-150 hover:opacity-80"
          >
            <Github className="h-4 w-4" />
            소스 코드
          </a>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-coral-400 px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors duration-150 hover:bg-coral-500"
          >
            Live Demo
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      <div className="flex shrink-0 items-end gap-4">
        <div className="landing-float-slow mb-5">
          <Phone scale={0.9}>
            <GalleryMock />
          </Phone>
        </div>
        <div className="landing-float-slow landing-float-delay-1500ms">
          <Phone>
            <DashMock />
          </Phone>
        </div>
      </div>
    </section>
  );
}
