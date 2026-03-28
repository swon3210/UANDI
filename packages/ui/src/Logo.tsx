import type { SVGProps } from 'react';

// ─── UANDI 로고 ─────────────────────────────────────────────────────────────
//
// 아이콘 마크: 코랄색 하트
//   - 통통하고 둥근 하트 아이콘 + 좌상단 하이라이트(반짝임)
//   - 코랄색 "UANDI" 워드마크 (둥근 모서리)
//
// 세 가지 variant:
//   full      — 아이콘 + 워드마크 수평 조합 (헤더 등에 사용)
//   icon      — 아이콘 단독, 투명 배경 (일반 사용)
//   app-icon  — 아이콘, 코랄 배경 (파비콘, 앱 아이콘 등)

export type LogoVariant = 'full' | 'icon' | 'app-icon';

export type LogoProps = SVGProps<SVGSVGElement> & {
  variant?: LogoVariant;
};

// ─────────────────────────────────────────────────────────────────────────────
// 공유 상수
// ─────────────────────────────────────────────────────────────────────────────

const CORAL = '#E8837A';

// 하트 경로 (48×48 좌표계)
// — 통통한 로브 + Q 커브로 하단 부드럽게 마감
const HEART_PATH = [
  'M24 10',
  'C23.5 7 21 3.5 16.5 3.5', // 상단 중심 → 왼쪽 로브 상단
  'C9 3.5 3.5 9 3.5 16', // 왼쪽 로브 원형
  'C3.5 24 15 33 22 36.5', // 왼쪽 하단 곡선
  'Q24 38 26 36.5', // 하단 끝 — Q 커브로 둥글게
  'C33 33 44.5 24 44.5 16', // 오른쪽 하단 곡선
  'C44.5 9 39 3.5 31.5 3.5', // 오른쪽 로브 원형
  'C27 3.5 24.5 7 24 10Z', // 오른쪽 로브 → 상단 중심
].join('');

// app-icon용 하트 (40×40 좌표계)
const HEART_PATH_SM = [
  'M20 10',
  'C19.5 7.5 17.5 4.5 14 4.5',
  'C8 4.5 4 9 4 14.5',
  'C4 21 13 28 18.5 31',
  'Q20 32.5 21.5 31',
  'C27 28 36 21 36 14.5',
  'C36 9 32 4.5 26 4.5',
  'C22.5 4.5 20.5 7.5 20 10Z',
].join('');

// ─────────────────────────────────────────────────────────────────────────────
// Logo 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export function Logo({ variant = 'full', ...props }: LogoProps) {
  // ── app-icon: 투명 배경 코랄 하트 + 하이라이트 ─────────────────────────────
  if (variant === 'app-icon') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="UANDI"
        {...props}
      >
        <path d={HEART_PATH_SM} fill={CORAL} />
        {/* 좌상단 하이라이트 */}
        <ellipse
          cx="12"
          cy="12"
          rx="4"
          ry="3.5"
          fill="white"
          opacity="0.3"
          transform="rotate(-20 12 12)"
        />
      </svg>
    );
  }

  // ── icon: 투명 배경 코랄 하트 ───────────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="UANDI"
        {...props}
      >
        <path d={HEART_PATH} fill={CORAL} />
        {/* 좌상단 하이라이트 */}
        <ellipse
          cx="14"
          cy="13"
          rx="5"
          ry="4.5"
          fill="white"
          opacity="0.3"
          transform="rotate(-20 14 13)"
        />
      </svg>
    );
  }

  // ── full: 하트 아이콘 + 워드마크 수평 조합 ─────────────────────────────────
  return (
    <svg
      viewBox="0 0 160 48"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="UANDI"
      {...props}
    >
      {/* 하트 아이콘 */}
      <path d={HEART_PATH} fill={CORAL} />
      {/* 좌상단 하이라이트 */}
      <ellipse
        cx="14"
        cy="13"
        rx="5"
        ry="4.5"
        fill="white"
        opacity="0.3"
        transform="rotate(-20 14 13)"
      />

      {/* 워드마크 — stroke + round join으로 글자 모서리를 둥글게 */}
      <text
        x="54"
        y="24"
        dominantBaseline="middle"
        fontFamily="Nunito, Varela Round, Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="800"
        fill={CORAL}
        stroke={CORAL}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke"
        letterSpacing="1.5"
      >
        UANDI
      </text>
    </svg>
  );
}
