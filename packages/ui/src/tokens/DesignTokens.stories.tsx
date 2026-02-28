import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// ─── 디자인 토큰 스토리 ─────────────────────────────────────────────
// Design Tokens / Colors        — 컬러 팔레트 (Coral, Stone, Sage + 시맨틱)
// Design Tokens / Spacing       — 스페이싱 시스템 (4px 그리드)
// Design Tokens / Typography    — 타입 스케일 (6단계)
// Design Tokens / Elevation     — 그림자 4단계
// Design Tokens / Border Radius — 라디우스 6단계

// ─── 공유 UI 프리미티브 ────────────────────────────────────────────────

/** Stone 기반 — 토큰 문서 UI 자체에서 사용하는 색상 */
const C = {
  bg: '#FAFAF8', // stone-50
  card: '#FFFFFF',
  border: '#E9E4DF', // stone-200
  heading: '#1C1917', // stone-900
  body: '#504C47', // stone-700
  muted: '#706C67', // stone-600
  subtle: '#908B85', // stone-500
  coral: '#E8837A', // coral-400 (primary)
  green: '#4CAF86', // sage-400
};

function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '40px 48px',
        maxWidth: '960px',
        margin: '0 auto',
        fontFamily: 'Pretendard Variable, Pretendard, -apple-system, sans-serif',
        backgroundColor: C.bg,
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '44px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 700, color: C.heading, margin: 0 }}>{title}</h1>
      <p style={{ fontSize: '14px', color: C.muted, margin: '6px 0 0' }}>{subtitle}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: '52px' }}>
      <div
        style={{
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: C.heading, margin: 0 }}>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: C.muted, margin: '3px 0 0' }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: '6px',
        backgroundColor: '#FEF3F2',
        color: C.coral,
        border: '1px solid rgba(232,131,122,0.25)',
        marginTop: '4px',
      }}
    >
      {label}
    </span>
  );
}

// ─── 1. COLOR PALETTE ─────────────────────────────────────────────────

type SwatchData = {
  scale: number;
  hsl: string;
  hex: string;
  role?: string;
};

const CORAL: SwatchData[] = [
  { scale: 50, hsl: '4 100% 97%', hex: '#FEF3F2' },
  { scale: 100, hsl: '4 90% 93%', hex: '#FDDAD8' },
  { scale: 200, hsl: '4 82% 85%', hex: '#F9B2AC' },
  { scale: 300, hsl: '4 77% 77%', hex: '#F29290' },
  { scale: 400, hsl: '4 74% 69%', hex: '#E8837A', role: 'Primary' },
  { scale: 500, hsl: '4 65% 58%', hex: '#D8635A', role: 'Expense' },
  { scale: 600, hsl: '4 60% 46%', hex: '#BE4B44' },
  { scale: 700, hsl: '4 56% 35%', hex: '#923832' },
  { scale: 800, hsl: '4 52% 22%', hex: '#5E2320' },
  { scale: 900, hsl: '4 48% 13%', hex: '#381413' },
];

const STONE: SwatchData[] = [
  { scale: 50, hsl: '30 20% 98%', hex: '#FAFAF8', role: 'Background' },
  { scale: 100, hsl: '30 18% 95%', hex: '#F3F1ED' },
  { scale: 200, hsl: '30 15% 90%', hex: '#E9E4DF', role: 'Border' },
  { scale: 300, hsl: '30 12% 82%', hex: '#D5CFCA' },
  { scale: 400, hsl: '30 10% 68%', hex: '#B4AEA8' },
  { scale: 500, hsl: '28  9% 54%', hex: '#908B85' },
  { scale: 600, hsl: '25  8% 42%', hex: '#706C67', role: 'Muted FG' },
  { scale: 700, hsl: '22  7% 30%', hex: '#504C47' },
  { scale: 800, hsl: '20  6% 18%', hex: '#302D2A' },
  { scale: 900, hsl: '20  6% 10%', hex: '#1C1917', role: 'Foreground' },
];

const SAGE: SwatchData[] = [
  { scale: 50, hsl: '155 60% 96%', hex: '#ECFAF5' },
  { scale: 100, hsl: '155 52% 89%', hex: '#CDF0DF' },
  { scale: 200, hsl: '155 46% 77%', hex: '#98D9BF' },
  { scale: 300, hsl: '155 44% 63%', hex: '#63C39F' },
  { scale: 400, hsl: '155 43% 49%', hex: '#4CAF86', role: 'Income' },
  { scale: 500, hsl: '155 44% 37%', hex: '#368869' },
  { scale: 600, hsl: '155 45% 27%', hex: '#27644D' },
  { scale: 700, hsl: '155 46% 18%', hex: '#1A4333' },
];

const SEMANTIC = [
  {
    name: '--background',
    hsl: '30 20% 98%',
    hex: '#FAFAF8',
    tw: 'bg-background',
    desc: '페이지 배경',
  },
  {
    name: '--foreground',
    hsl: '20  6% 10%',
    hex: '#1C1917',
    tw: 'text-foreground',
    desc: '기본 텍스트',
  },
  { name: '--card', hsl: '0   0% 100%', hex: '#FFFFFF', tw: 'bg-card', desc: '카드/컨테이너 배경' },
  {
    name: '--primary',
    hsl: '4  74% 69%',
    hex: '#E8837A',
    tw: 'bg-primary',
    desc: 'CTA 버튼, 강조',
  },
  {
    name: '--primary-foreground',
    hsl: '0 0% 100%',
    hex: '#FFFFFF',
    tw: 'text-primary-foreground',
    desc: 'Primary 위 텍스트',
  },
  {
    name: '--secondary',
    hsl: '30 18% 95%',
    hex: '#F3F1ED',
    tw: 'bg-secondary',
    desc: '보조 배경, 서브 버튼',
  },
  {
    name: '--muted-foreground',
    hsl: '25  8% 42%',
    hex: '#706C67',
    tw: 'text-muted-foreground',
    desc: '날짜, 보조 텍스트',
  },
  {
    name: '--accent',
    hsl: '4 100% 95%',
    hex: '#FEF3F2',
    tw: 'bg-accent',
    desc: 'Hover, 선택 상태 배경',
  },
  {
    name: '--border',
    hsl: '30 15% 90%',
    hex: '#E9E4DF',
    tw: 'border-border',
    desc: '구분선, 테두리',
  },
  {
    name: '--destructive',
    hsl: '0  72% 51%',
    hex: '#DC2626',
    tw: 'text-destructive',
    desc: '삭제, 에러',
  },
  {
    name: '--income',
    hsl: '155 43% 49%',
    hex: '#4CAF86',
    tw: 'text-income',
    desc: '수입 금액 (sage-400)',
  },
  {
    name: '--expense',
    hsl: '4  65% 58%',
    hex: '#D8635A',
    tw: 'text-expense',
    desc: '지출 금액 (coral-500)',
  },
];

function ColorSwatch({ scale, hsl, hex, role }: SwatchData) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div
        style={{
          height: '64px',
          borderRadius: '8px 8px 0 0',
          backgroundColor: `hsl(${hsl})`,
          border: '1px solid rgba(0,0,0,0.07)',
          borderBottom: 'none',
        }}
      />
      <div
        style={{
          padding: '6px 8px 8px',
          borderRadius: '0 0 8px 8px',
          border: '1px solid rgba(0,0,0,0.07)',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          backgroundColor: C.card,
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: C.heading }}>{scale}</div>
        <div
          style={{ fontSize: '10px', fontFamily: 'monospace', color: C.muted, marginTop: '2px' }}
        >
          {hex}
        </div>
        {role && <Chip label={role} />}
      </div>
    </div>
  );
}

function PaletteRow({
  label,
  description,
  swatches,
  cols = 10,
}: {
  label: string;
  description: string;
  swatches: SwatchData[];
  cols?: number;
}) {
  return (
    <Section title={label} subtitle={description}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '6px',
        }}
      >
        {swatches.map((s) => (
          <ColorSwatch key={s.scale} {...s} />
        ))}
      </div>
    </Section>
  );
}

function ColorsPage() {
  return (
    <PageWrapper>
      <PageTitle
        title="Color Palette"
        subtitle="포근함 / 신뢰 / 프라이빗 / 깔끔함 키워드를 기반으로 구성된 3개 팔레트 + 시맨틱 토큰"
      />

      <PaletteRow
        label="Coral — 브랜드"
        description="포근함 · 주요 강조색, CTA 버튼, 지출 금액"
        swatches={CORAL}
        cols={10}
      />

      <PaletteRow
        label="Stone — 워밍 뉴트럴"
        description="깔끔함 · 배경, 텍스트, 구분선. 순수 회색 대신 30° 황금빛 언더톤"
        swatches={STONE}
        cols={10}
      />

      <PaletteRow
        label="Sage — 수입 / 긍정"
        description="신뢰 · 따뜻한 그린 계열, 수입 금액 강조"
        swatches={SAGE}
        cols={8}
      />

      <Section
        title="Semantic Tokens"
        subtitle="컴포넌트에서 직접 사용하는 CSS 변수 → Tailwind 유틸리티 클래스"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {SEMANTIC.map((t) => (
            <div
              key={t.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 210px 96px 220px 1fr',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  backgroundColor: `hsl(${t.hsl})`,
                  border: '1px solid rgba(0,0,0,0.08)',
                  flexShrink: 0,
                }}
              />
              <code
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: C.heading,
                  fontWeight: 500,
                }}
              >
                {t.name}
              </code>
              <code
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: C.muted,
                }}
              >
                {t.hex}
              </code>
              <code
                style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: C.green,
                }}
              >
                {t.tw}
              </code>
              <span style={{ fontSize: '12px', color: C.subtle }}>{t.desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </PageWrapper>
  );
}

// ─── 2. SPACING ───────────────────────────────────────────────────────

type SpacingItem = { label: string; px: number; tw: string; usage: string };

const COMPONENT_SPACING: SpacingItem[] = [
  { label: 'XS', px: 4, tw: 'gap-1', usage: '아이콘 + 라벨 사이' },
  { label: 'SM', px: 8, tw: 'gap-2 / p-2', usage: '입력 필드 내부, 뱃지 패딩' },
  { label: 'MD', px: 12, tw: 'gap-3', usage: '리스트 아이템 간격' },
  { label: 'LG', px: 16, tw: 'gap-4 / p-4', usage: '카드 내부 패딩, 폼 필드 간격' },
  { label: 'XL', px: 24, tw: 'gap-6', usage: '관련 요소 그룹 간격' },
];

const LAYOUT_SPACING: SpacingItem[] = [
  { label: 'Page Padding', px: 16, tw: 'px-4', usage: '화면 좌우 여백' },
  { label: 'Card Padding', px: 16, tw: 'p-4', usage: '카드 내부 패딩' },
  { label: 'Section Gap', px: 24, tw: 'space-y-6', usage: '페이지 내 섹션 간격' },
  { label: 'Layout Gap', px: 32, tw: 'gap-8', usage: '주요 구조 간격' },
  { label: 'Page Top', px: 48, tw: 'pt-12', usage: '섹션 시작 상단 여백' },
];

const LAYOUT_CONSTANTS = [
  { label: 'Header Height', value: '56px', tw: 'h-14', cssVar: '--header-h' },
  { label: 'Bottom Nav Height', value: '64px', tw: 'h-16', cssVar: '--bottom-nav-h' },
  { label: 'Page Max Width', value: '448px', tw: 'max-w-md', cssVar: '--page-max-w' },
  { label: 'Page H. Padding', value: '16px', tw: 'px-4', cssVar: '--page-px' },
];

/** 4px 그리드에서 실제 px 크기를 시각적 bar 너비로 환산 (1px → 6px) */
function SpacingBar({ label, px, tw, usage }: SpacingItem) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '96px 1fr 144px 1fr',
        alignItems: 'center',
        gap: '16px',
        padding: '6px 0',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: C.heading,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {label}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 400,
            color: C.subtle,
          }}
        >
          {px}px
        </span>
      </div>
      {/* 시각적 bar */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: `${px * 5}px`,
            height: '24px',
            borderRadius: '4px',
            backgroundColor: C.coral,
            opacity: 0.18,
            border: `1.5px solid ${C.coral}`,
            position: 'relative',
          }}
        />
      </div>
      <code style={{ fontSize: '12px', color: C.green, fontFamily: 'monospace' }}>{tw}</code>
      <span style={{ fontSize: '12px', color: C.muted }}>{usage}</span>
    </div>
  );
}

function SpacingPage() {
  return (
    <PageWrapper>
      <PageTitle
        title="Spacing System"
        subtitle="4px 기준 그리드. TailwindCSS 기본 스케일(1 unit = 4px)을 그대로 활용합니다."
      />

      <Section title="컴포넌트 레벨" subtitle="UI 요소 내부와 요소 간 간격">
        {COMPONENT_SPACING.map((s) => (
          <SpacingBar key={s.label} {...s} />
        ))}
      </Section>

      <Section title="레이아웃 레벨" subtitle="페이지 구조와 섹션 간 간격">
        {LAYOUT_SPACING.map((s) => (
          <SpacingBar key={s.label} {...s} />
        ))}
      </Section>

      <Section
        title="레이아웃 상수"
        subtitle="CSS 변수로 정의된 고정값 — calc()에서 직접 참조 가능"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {LAYOUT_CONSTANTS.map((c) => (
            <div
              key={c.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 80px 140px 1fr',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: '8px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.heading }}>{c.label}</span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: C.coral,
                  fontFamily: 'monospace',
                }}
              >
                {c.value}
              </span>
              <code style={{ fontSize: '12px', color: C.green, fontFamily: 'monospace' }}>
                {c.tw}
              </code>
              <code style={{ fontSize: '12px', color: C.muted, fontFamily: 'monospace' }}>
                {c.cssVar}
              </code>
            </div>
          ))}
        </div>

        {/* 레이아웃 예시 코드 */}
        <pre
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            borderRadius: '10px',
            backgroundColor: '#1C1917',
            color: '#E9E4DF',
            fontSize: '12px',
            fontFamily: 'monospace',
            lineHeight: 1.7,
            overflowX: 'auto',
          }}
        >{`/* 모든 페이지의 기본 레이아웃 패턴 */
<main className="max-w-md mx-auto px-4 pb-16">
  {/* pb-16: bottom nav 높이만큼 하단 여백 확보 */}
</main>`}</pre>
      </Section>
    </PageWrapper>
  );
}

// ─── 3. TYPOGRAPHY ────────────────────────────────────────────────────

const TYPE_SCALE = [
  {
    role: 'Display',
    size: 24,
    weight: 700,
    weightLabel: 'Bold',
    lineHeight: 1.3,
    usage: '페이지 타이틀',
    classes: 'text-2xl font-bold leading-tight',
    sample: '우리 둘의 사진첩',
  },
  {
    role: 'Title',
    size: 20,
    weight: 600,
    weightLabel: 'SemiBold',
    lineHeight: 1.4,
    usage: '섹션 제목, 카드 헤딩',
    classes: 'text-xl font-semibold leading-snug',
    sample: '이번 달 가계부',
  },
  {
    role: 'Subtitle',
    size: 18,
    weight: 500,
    weightLabel: 'Medium',
    lineHeight: 1.5,
    usage: '서브 제목, 강조 본문',
    classes: 'text-lg font-medium',
    sample: '3월 지출 내역',
  },
  {
    role: 'Body',
    size: 16,
    weight: 400,
    weightLabel: 'Regular',
    lineHeight: 1.6,
    usage: '기본 본문',
    classes: 'text-base',
    sample: '오늘 같이 카페 다녀왔어요',
  },
  {
    role: 'Secondary',
    size: 14,
    weight: 400,
    weightLabel: 'Regular',
    lineHeight: 1.5,
    usage: '설명, 보조 정보',
    classes: 'text-sm text-muted-foreground',
    sample: '식비 / 카페라떼 두 잔',
    muted: true,
  },
  {
    role: 'Caption',
    size: 12,
    weight: 400,
    weightLabel: 'Regular',
    lineHeight: 1.4,
    usage: '날짜, 메타 정보',
    classes: 'text-xs text-muted-foreground',
    sample: '2026년 3월 1일',
    muted: true,
  },
];

function TypographyPage() {
  return (
    <PageWrapper>
      <PageTitle title="Typography" subtitle="Pretendard Variable 폰트 기반 6단계 타입 스케일" />

      <Section title="타입 스케일">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {TYPE_SCALE.map((t) => (
            <div
              key={t.role}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 180px',
                alignItems: 'center',
                gap: '24px',
                padding: '18px 20px',
                borderRadius: '10px',
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              {/* 메타 정보 */}
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: C.coral,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '3px',
                  }}
                >
                  {t.role}
                </div>
                <div style={{ fontSize: '11px', color: C.muted }}>
                  {t.size}px / {t.weightLabel}
                </div>
                <div style={{ fontSize: '11px', color: C.subtle }}>line-height {t.lineHeight}</div>
              </div>

              {/* 샘플 텍스트 */}
              <div
                style={{
                  fontSize: `${t.size}px`,
                  fontWeight: t.weight,
                  lineHeight: t.lineHeight,
                  color: t.muted ? C.muted : C.heading,
                }}
              >
                {t.sample}
              </div>

              {/* Tailwind 클래스 */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '4px' }}>
                  {t.usage}
                </div>
                <code
                  style={{
                    fontSize: '10px',
                    color: C.green,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    lineHeight: 1.5,
                  }}
                >
                  {t.classes}
                </code>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="금액 표시 패턴"
        subtitle="tabular-nums — 숫자 자릿수 정렬을 위해 고정폭 숫자 사용"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {/* 실제 예시 */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '12px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {[
              { label: '이번 달 수입', amount: '+2,150,000원', color: C.green },
              { label: '이번 달 지출', amount: '-842,000원', color: '#D8635A' },
              { label: '잔액', amount: '1,308,000원', color: C.heading },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '14px', color: C.muted }}>{item.label}</span>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: item.color,
                  }}
                >
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
          {/* 코드 */}
          <pre
            style={{
              margin: 0,
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#1C1917',
              color: '#E9E4DF',
              fontSize: '12px',
              fontFamily: 'monospace',
              lineHeight: 1.75,
              overflow: 'hidden',
            }}
          >{`<span className={cn(
  "text-lg font-semibold",
  "tabular-nums",   // 자릿수 정렬
  "text-income",    // sage-400
)}>
  +150,000원
</span>

<span className={cn(
  "text-lg font-semibold",
  "tabular-nums",
  "text-expense",   // coral-500
)}>
  -42,000원
</span>`}</pre>
        </div>
      </Section>
    </PageWrapper>
  );
}

// ─── 4. ELEVATION ─────────────────────────────────────────────────────

const SHADOWS = [
  {
    label: 'SM',
    cssVar: '--shadow-sm',
    tw: 'shadow-sm',
    css: '0 1px 2px 0 rgba(28,25,23,0.05)',
    usage: '카드 미세 부각',
    note: '사용 자제. 대부분의 카드는 border만 사용',
  },
  {
    label: 'MD',
    cssVar: '--shadow-md',
    tw: 'shadow-md',
    css: '0 2px 8px 0 rgba(28,25,23,0.08)',
    usage: '카드, 드롭다운',
    note: 'border 대신 그림자가 필요한 카드에 사용',
  },
  {
    label: 'LG',
    cssVar: '--shadow-lg',
    tw: 'shadow-lg',
    css: '0 4px 16px 0 rgba(28,25,23,0.10)',
    usage: 'Floating 버튼, 팝오버',
    note: '화면 위에 떠 있는 요소',
  },
  {
    label: 'XL',
    cssVar: '--shadow-xl',
    tw: 'shadow-xl',
    css: '0 8px 32px 0 rgba(28,25,23,0.12)',
    usage: '바텀 시트, 모달',
    note: 'overlay-kit 오버레이에만 적극 사용',
  },
];

function ElevationPage() {
  return (
    <PageWrapper>
      <PageTitle
        title="Elevation"
        subtitle="그림자 4단계. 컬러 위주 디자인이므로 그림자는 최소화 — 오버레이 UI에만 적극 사용"
      />

      <Section title="Shadow Scale">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {SHADOWS.map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 카드 프리뷰 */}
              <div
                style={{
                  backgroundColor: C.card,
                  borderRadius: '12px',
                  padding: '24px 20px',
                  boxShadow: s.css,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minHeight: '88px',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 700, color: C.heading }}>
                  {s.label}
                </span>
                <span style={{ fontSize: '10px', color: C.subtle }}>shadow</span>
              </div>
              {/* 메타 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <code style={{ fontSize: '11px', fontFamily: 'monospace', color: C.muted }}>
                    {s.cssVar}
                  </code>
                  <code style={{ fontSize: '11px', fontFamily: 'monospace', color: C.green }}>
                    {s.tw}
                  </code>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: C.body,
                    marginBottom: '3px',
                  }}
                >
                  {s.usage}
                </div>
                <div style={{ fontSize: '11px', color: C.subtle, lineHeight: 1.4 }}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="사용 원칙">
        <div
          style={{
            borderRadius: '12px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {[
            { element: '기본 카드', rec: 'border border-border 만 사용 (shadow 없음)' },
            { element: '인터랙티브 카드 (hover 시)', rec: 'shadow-sm 추가' },
            { element: '드롭다운 / 팝오버', rec: 'shadow-md' },
            { element: 'FAB (Floating Action)', rec: 'shadow-lg' },
            { element: 'overlay-kit 오버레이', rec: 'shadow-xl (자동 적용)' },
          ].map((item, i, arr) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '240px 1fr',
                gap: '16px',
                padding: '11px 20px',
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.heading }}>
                {item.element}
              </span>
              <code style={{ fontSize: '13px', fontFamily: 'monospace', color: C.green }}>
                {item.rec}
              </code>
            </div>
          ))}
        </div>
      </Section>
    </PageWrapper>
  );
}

// ─── 5. BORDER RADIUS ─────────────────────────────────────────────────

const RADII = [
  { label: 'SM', px: 8, tw: 'rounded-lg', cssVar: '--radius-sm', usage: '뱃지, 태그, 칩' },
  { label: 'MD', px: 10, tw: 'rounded-[10px]', cssVar: '--radius-md', usage: '버튼, 입력 필드' },
  { label: 'LG', px: 12, tw: 'rounded-xl', cssVar: '--radius-lg', usage: '카드, 컨테이너 (기본)' },
  { label: 'XL', px: 16, tw: 'rounded-2xl', cssVar: '--radius-xl', usage: '모달, 다이얼로그' },
  { label: '2XL', px: 20, tw: 'rounded-[20px]', cssVar: '--radius-2xl', usage: '바텀 시트 상단' },
  { label: 'Full', px: 9999, tw: 'rounded-full', cssVar: null, usage: '아바타, 토글, 필 버튼' },
];

function BorderRadiusPage() {
  return (
    <PageWrapper>
      <PageTitle
        title="Border Radius"
        subtitle="6단계 라디우스 스케일. 기본값 --radius: 12px (rounded-xl)"
      />

      <Section title="Radius Scale">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
          {RADII.map((r) => (
            <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 모양 프리뷰 */}
              <div
                style={{
                  height: '72px',
                  backgroundColor: 'rgba(232,131,122,0.12)',
                  borderRadius: r.px >= 9999 ? '9999px' : `${r.px}px`,
                  border: `2px solid ${C.coral}`,
                  opacity: 0.9,
                }}
              />
              {/* 메타 */}
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: C.heading,
                    marginBottom: '3px',
                  }}
                >
                  {r.label}
                  {r.px < 9999 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 400,
                        color: C.subtle,
                        marginLeft: '4px',
                      }}
                    >
                      {r.px}px
                    </span>
                  )}
                </div>
                <code
                  style={{
                    fontSize: '11px',
                    color: C.green,
                    fontFamily: 'monospace',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  {r.tw}
                </code>
                {r.cssVar && (
                  <code
                    style={{
                      fontSize: '10px',
                      color: C.subtle,
                      fontFamily: 'monospace',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    {r.cssVar}
                  </code>
                )}
                <div style={{ fontSize: '11px', color: C.muted, lineHeight: 1.4 }}>{r.usage}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="실사용 예제">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* Badge SM */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '10px' }}>
              SM (8px) — Badge / Tag
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['식비', '카페', '교통'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '3px 10px',
                    backgroundColor: '#FEF3F2',
                    color: C.coral,
                    borderRadius: '8px',
                    border: '1px solid rgba(232,131,122,0.2)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Button MD */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '10px' }}>
              MD (10px) — Button
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '8px 16px',
                  backgroundColor: C.coral,
                  color: '#fff',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                저장하기
              </button>
              <button
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: C.heading,
                  borderRadius: '10px',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
            </div>
          </div>

          {/* Card LG */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '10px' }}>
              LG (12px) — Card
            </div>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 500, color: C.heading }}>카드 컨텐츠</div>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>보조 텍스트</div>
            </div>
          </div>

          {/* Avatar Full */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '10px' }}>
              Full — Avatar
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {['U', 'A'].map((char, i) => (
                <div
                  key={i}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '9999px',
                    backgroundColor: i === 0 ? C.coral : C.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>{char}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dialog XL */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '10px' }}>
              XL (16px) — Dialog / Modal
            </div>
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '16px',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.heading }}>
                사진을 삭제할까요?
              </div>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '3px' }}>
                되돌릴 수 없어요
              </div>
            </div>
          </div>

          {/* Bottom Sheet 2XL */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '10px' }}>
              2XL (20px) — Bottom Sheet 상단
            </div>
            <div
              style={{
                padding: '14px 14px 8px',
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: '20px 20px 0 0',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: C.border,
                  margin: '0 auto 10px',
                }}
              />
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.heading }}>내역 추가</div>
            </div>
          </div>
        </div>
      </Section>
    </PageWrapper>
  );
}

// ─── META & EXPORTS ───────────────────────────────────────────────────

const meta: Meta = {
  title: 'Design Tokens',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'UANDI 디자인 시스템의 토큰 레퍼런스. 포근함 / 신뢰 / 프라이빗 / 깔끔함 키워드 기반.',
      },
    },
  },
};

export default meta;

export const Colors: StoryObj = {
  name: 'Color Palette',
  render: () => <ColorsPage />,
};

export const Spacing: StoryObj = {
  name: 'Spacing',
  render: () => <SpacingPage />,
};

export const Typography: StoryObj = {
  name: 'Typography',
  render: () => <TypographyPage />,
};

export const Elevation: StoryObj = {
  name: 'Elevation',
  render: () => <ElevationPage />,
};

export const BorderRadius: StoryObj = {
  name: 'Border Radius',
  render: () => <BorderRadiusPage />,
};
