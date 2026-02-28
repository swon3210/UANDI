import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta: Meta<typeof Logo> = {
  title: 'Brand/Logo',
  component: Logo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**UANDI 브랜드 로고.** "ui" 리가처 아이콘 마크 + UANDI 워드마크.\n\n' +
          '아이콘 마크는 U(You) + i(I) 리가처로, U 아크의 오른쪽 다리 위에 "i" 점을 더해 ' +
          '"You and I"를 하나의 스트로크로 표현합니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

// ── 기본 variant ──────────────────────────────────────────────────────────────

export const FullLogo: Story = {
  name: '전체 로고 — 아이콘 + 워드마크',
  args: { variant: 'full' },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px 48px', backgroundColor: '#FAFAF8' }}>
        <Story style={{ height: '40px' }} />
      </div>
    ),
  ],
};

export const IconMark: Story = {
  name: '아이콘 마크 — 투명 배경',
  args: { variant: 'icon' },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px 48px', backgroundColor: '#FAFAF8' }}>
        <Story style={{ height: '48px' }} />
      </div>
    ),
  ],
};

export const AppIcon: Story = {
  name: '앱 아이콘 — 코랄 배경',
  args: { variant: 'app-icon' },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px 48px', backgroundColor: '#FAFAF8' }}>
        <Story style={{ width: '64px', height: '64px' }} />
      </div>
    ),
  ],
};

// ── 사이즈 비교 ───────────────────────────────────────────────────────────────

export const SizeComparison: Story = {
  name: '사이즈 비교',
  render: () => (
    <div
      style={{
        padding: '40px 48px',
        backgroundColor: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {/* 전체 로고 사이즈 */}
      <div>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#908B85',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
          }}
        >
          Full Logo
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'lg — 헤더 기본', h: 40 },
            { label: 'md — 컴팩트 헤더', h: 32 },
            { label: 'sm — 하단 표시 등', h: 24 },
          ].map(({ label, h }) => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '160px' }}>
                <Logo variant="full" style={{ height: `${h}px` }} />
              </div>
              <span style={{ fontSize: '12px', color: '#706C67' }}>
                h={h}px — {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 아이콘 사이즈 */}
      <div>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#908B85',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
          }}
        >
          App Icon
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          {[64, 48, 40, 32, 24, 16].map((size) => (
            <div
              key={size}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
            >
              <Logo variant="app-icon" style={{ width: `${size}px`, height: `${size}px` }} />
              <span style={{ fontSize: '10px', color: '#908B85' }}>{size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

// ── 배경 대비 ─────────────────────────────────────────────────────────────────

export const BackgroundVariants: Story = {
  name: '배경 대비',
  render: () => (
    <div style={{ display: 'flex', gap: '0' }}>
      {/* 라이트 */}
      <div
        style={{
          flex: 1,
          padding: '40px 32px',
          backgroundColor: '#FAFAF8',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#908B85', margin: 0 }}>Light</p>
        <Logo variant="full" style={{ height: '36px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Logo variant="icon" style={{ height: '32px' }} />
          <Logo variant="app-icon" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>

      {/* 화이트 카드 */}
      <div
        style={{
          flex: 1,
          padding: '40px 32px',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E9E4DF',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#908B85', margin: 0 }}>White</p>
        <Logo variant="full" style={{ height: '36px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <Logo variant="icon" style={{ height: '32px' }} />
          <Logo variant="app-icon" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>

      {/* 다크 */}
      <div
        style={{
          flex: 1,
          padding: '40px 32px',
          backgroundColor: '#1C1917',
          borderLeft: '1px solid #302D2A',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#504C47', margin: 0 }}>Dark</p>
        {/* 다크 배경에서 아이콘 마크(코랄)와 앱 아이콘은 문제없음 */}
        {/* 워드마크 텍스트(#1C1917)는 보이지 않으므로 아이콘만 표시 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Logo variant="icon" style={{ height: '36px' }} />
          <Logo variant="app-icon" style={{ width: '48px', height: '48px' }} />
        </div>
        <p style={{ fontSize: '11px', color: '#504C47', margin: 0 }}>
          다크 배경에서 워드마크는
          <br />
          별도 white 버전 필요
        </p>
      </div>
    </div>
  ),
};

// ── 실사용 맥락 ───────────────────────────────────────────────────────────────

export const InContext: Story = {
  name: '실사용 — 모바일 헤더',
  render: () => (
    <div
      style={{
        width: '390px',
        backgroundColor: '#FAFAF8',
        border: '1px solid #E9E4DF',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <header
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #E9E4DF',
          backgroundColor: '#FAFAF8',
          padding: '0 16px',
        }}
      >
        <Logo variant="full" style={{ height: '28px' }} />
      </header>

      {/* 더미 컨텐츠 */}
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: '64px',
              borderRadius: '12px',
              backgroundColor: '#F3F1ED',
            }}
          />
        ))}
      </div>
    </div>
  ),
};
