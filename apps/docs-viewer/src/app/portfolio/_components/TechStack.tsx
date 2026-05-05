'use client';

import { SectionLabel } from './SectionLabel';
import { useReveal } from './useReveal';

type Badge = { label: string; color: string; bg: string };

const TECH: Badge[] = [
  { label: 'Next.js 14', color: '#000000', bg: '#f5f5f5' },
  { label: 'React', color: '#087ea4', bg: '#e8f4fd' },
  { label: 'TypeScript', color: '#2f74c0', bg: '#e8f0fb' },
  { label: 'TailwindCSS v4', color: '#0ea5e9', bg: '#e0f7ff' },
  { label: 'Firebase', color: '#e37400', bg: '#fff4e0' },
  { label: 'Firestore', color: '#e37400', bg: '#fff4e0' },
  { label: 'shadcn/ui', color: '#18181b', bg: '#f4f4f5' },
  { label: 'Turborepo', color: '#e84393', bg: '#fde8f3' },
  { label: 'pnpm', color: '#f69220', bg: '#fff3e0' },
];

const NOTES = [
  { label: '모노레포 구조', desc: 'Turborepo + pnpm workspace로 앱·UI 패키지·도메인 로직 분리' },
  { label: '모바일 퍼스트', desc: 'max-w-md(448px) 기준 모바일 레이아웃, 데스크탑 보조 지원' },
  { label: '실시간 동기화', desc: 'Firestore 실시간 리스너로 커플 간 즉시 반영' },
  { label: 'AI 파이프라인', desc: '영수증 OCR + 자연어 파싱 + 지출 패턴 분석 자동화' },
];

export function TechStack() {
  const ref = useReveal();
  return (
    <section ref={ref} className="landing-fade-up mb-24">
      <SectionLabel>Tech Stack</SectionLabel>
      <div className="flex flex-wrap justify-center gap-2">
        {TECH.map((t) => (
          <span
            key={t.label}
            className="rounded-md border border-stone-200 px-2.5 py-1 text-[11.5px] font-medium whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-mono)',
              color: t.color,
              background: t.bg,
            }}
          >
            {t.label}
          </span>
        ))}
      </div>
      <div
        className="mt-6 grid gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        {NOTES.map((n) => (
          <div key={n.label}>
            <div className="mb-1 text-[12px] font-semibold text-stone-900">{n.label}</div>
            <div className="text-[12px] text-stone-500" style={{ lineHeight: 1.55 }}>
              {n.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
