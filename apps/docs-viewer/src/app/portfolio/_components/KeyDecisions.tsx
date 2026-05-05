'use client';

import { SectionLabel } from './SectionLabel';
import { useReveal } from './useReveal';

const DECISIONS = [
  {
    num: '01',
    title: '커플 단위 데이터 격리',
    desc: 'Firebase UID 기반이 아닌 커플 코드 단위로 Firestore 컬렉션을 설계해 완전한 데이터 프라이버시를 구현했습니다.',
  },
  {
    num: '02',
    title: '자연어 파싱 파이프라인',
    desc: 'LLM을 활용해 비정형 텍스트에서 금액·날짜·카테고리를 추출하고 복수 건을 트랜잭션으로 일괄 저장합니다.',
  },
  {
    num: '03',
    title: '모노레포 패키지 분리',
    desc: 'UI 컴포넌트(shadcn 기반)와 가계부 도메인 로직을 독립 패키지로 분리해 재사용성과 테스트 용이성을 높였습니다.',
  },
  {
    num: '04',
    title: '모바일 퍼스트 UX',
    desc: '448px 고정 컨텐츠 폭, 하단 네비게이션, 바텀시트 패턴으로 네이티브 앱에 준하는 모바일 경험을 웹으로 구현했습니다.',
  },
];

function Card({ num, title, desc }: { num: string; title: string; desc: string }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="landing-fade-up rounded-xl border border-stone-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="mb-2 text-[11px] font-bold text-coral-400"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {num}
      </div>
      <div className="mb-1.5 text-[14px] font-bold text-stone-900">{title}</div>
      <div className="text-[12.5px] text-stone-500" style={{ lineHeight: 1.65 }}>
        {desc}
      </div>
    </div>
  );
}

export function KeyDecisions() {
  return (
    <section className="mb-24">
      <SectionLabel>Key Decisions</SectionLabel>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {DECISIONS.map((d) => (
          <Card key={d.num} {...d} />
        ))}
      </div>
    </section>
  );
}
