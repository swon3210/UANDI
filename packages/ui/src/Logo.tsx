import type { SVGProps } from 'react';

// ─── UANDI 로고 ─────────────────────────────────────────────────────────────
//
// 아이콘 마크: "ui" 리가처
//   - U 아크(하단 곡선) + 두 수직선 → "U" (You)
//   - U의 오른쪽 다리 위에 점(dot) → "i" (I)
//   - 두 요소가 하나의 스트로크로 연결 → "You and I" = UANDI
//
// 세 가지 variant:
//   full      — 아이콘 + 워드마크 수평 조합 (헤더 등에 사용)
//   icon      — 아이콘 단독, 투명 배경 (일반 사용)
//   app-icon  — 아이콘, 코랄 배경 (파비콘, 앱 아이콘 등)

export type LogoVariant = 'full' | 'icon' | 'app-icon';

export type LogoProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  variant?: LogoVariant;
};

// ─────────────────────────────────────────────────────────────────────────────
// 공유 상수
// ─────────────────────────────────────────────────────────────────────────────

const CORAL = '#E8837A';
const INK = '#1C1917'; // stone-900

// "ui" 리가처 경로 (44×48 좌표계)
//  M5 11  — U 왼쪽 상단
//  L5 29  — 왼쪽 다리 하강
//  Q5 44 21 44  — 하단 곡선 왼쪽 절반
//  Q37 44 37 29 — 하단 곡선 오른쪽 절반
//  L37 11 — 오른쪽 다리 상승 (← 이 선이 "i"의 몸통)
const UI_PATH = 'M5 11L5 29Q5 44 21 44Q37 44 37 29L37 11';

// ─────────────────────────────────────────────────────────────────────────────
// Logo 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export function Logo({ variant = 'full', ...props }: LogoProps) {
  // ── app-icon: 코랄 배경 + 흰 마크 ─────────────────────────────────────────
  if (variant === 'app-icon') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="UANDI"
        {...props}
      >
        {/* 코랄 배경 */}
        <rect width="40" height="40" rx="9" fill={CORAL} />
        {/* 흰 "ui" 리가처 (40×40 좌표계로 축소) */}
        {/*  원본 44×48 → 40×40: x *= 0.83, y *= 0.79  */}
        <path
          d="M4 8L4 22Q4 34 20 34Q36 34 36 22L36 8"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* 흰 "i" 점 */}
        <circle cx="36" cy="3.5" r="2.8" fill="white" />
      </svg>
    );
  }

  // ── icon: 투명 배경 코랄 마크 ─────────────────────────────────────────────
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 44 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="UANDI"
        {...props}
      >
        <path d={UI_PATH} stroke={CORAL} strokeWidth="3.5" strokeLinecap="round" />
        {/* "i" 점 — U 오른쪽 다리 (x=37) 위에 위치 */}
        <circle cx="37" cy="4.5" r="3.5" fill={CORAL} />
      </svg>
    );
  }

  // ── full: 아이콘 + 워드마크 수평 조합 ────────────────────────────────────
  //   viewBox 너비: 44(아이콘) + 14(간격) + ~90(텍스트) ≈ 148
  //   * <text> 너비는 폰트에 따라 달라지므로 overflow="visible" 사용
  return (
    <svg
      viewBox="0 0 148 48"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="UANDI"
      {...props}
    >
      {/* 아이콘 마크 */}
      <path d={UI_PATH} stroke={CORAL} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="37" cy="4.5" r="3.5" fill={CORAL} />

      {/* 워드마크 ─────────────────────────────────────────────────────────── */}
      {/* 수직 중앙 정렬: dominant-baseline="middle" + y="24" (48px 기준 중심) */}
      {/*                                                                      */}
      {/* ※ 프로덕션에서는 텍스트를 path로 변환해 폰트 의존성을 없애는 것 권장  */}
      <text
        x="58"
        y="24"
        dominantBaseline="middle"
        fontFamily="Pretendard Variable, Pretendard, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill={INK}
        letterSpacing="-0.5"
      >
        UANDI
      </text>
    </svg>
  );
}
