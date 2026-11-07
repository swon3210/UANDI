/**
 * 예산 위저드의 진입 표식. 대시보드 권유 카드(온보딩 흐름)에서 연 위저드에만 붙여
 * 모든 단계 URL에 따라다니게 하고, 완료·종료 후 경제 목표 페이지가 "홈으로" 버튼을 띄우는 데 쓴다.
 *
 * 위저드는 단계마다 기록을 쌓으므로(push) 경제 목표의 ←는 지나온 위저드 단계로 돌아간다.
 * 대시보드에서 들어온 사람에게는 이 버튼이 대시보드로 가는 출구다.
 * 이어서 하기용으로 저장하는 단계 쿼리(`wizardLastStep`)에는 넣지 않는다.
 */
export const WIZARD_ENTRY_PARAM = 'from';
export const WIZARD_ENTRY_ONBOARDING = 'onboarding';

export type WizardEntry = typeof WIZARD_ENTRY_ONBOARDING | null;

export function parseWizardEntry(value: string | null): WizardEntry {
  return value === WIZARD_ENTRY_ONBOARDING ? WIZARD_ENTRY_ONBOARDING : null;
}

/** 진입 표식이 있으면 URL 쿼리에 덧붙인다. */
export function withWizardEntry(url: string, entry: WizardEntry): string {
  if (!entry) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${WIZARD_ENTRY_PARAM}=${entry}`;
}
