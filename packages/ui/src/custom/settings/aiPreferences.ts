// 가계부 AI 맞춤화의 knob 계약 — 순수 타입/상수 (프레젠테이션 전용, 도메인 디커플).
//
// 대상 프롬프트 3종:
//  A. 지출 분석(analyze-spending)   — 서술형 리포트 → 말투/관점/분량
//  B. 현금흐름 예측(predict-cashflow) — 구조화 예측 → 예측 성향 / 제외 카테고리
//  C. 거래 파싱(parse-entries·sync)  — 구조화 항목 → 가맹점·키워드 매핑 규칙 / 이체 키워드
//
// 보안 원칙:
//  - UI 기준으로 A·B는 enum(및 커플 카테고리 선택)만 노출해 자유 텍스트 입력구가 없다. 단, 최종
//    안전 보장은 서버가 프롬프트에 들어가는 모든 필드를 sanitize/enum 재검증하는 것에 있다
//    (예: B의 excludedCategories 도 서버에서 sanitize+캡). Firestore 직접 쓰기 우회에 대비.
//  - C의 `match`/이체 키워드만 사용자 입력 자유 텍스트다. 서버에서 (1) 개행/제어문자 strip,
//    (2) 길이·개수 캡, (3) category는 커플 카테고리로 enum 제약, (4) 프롬프트 내 하위-우선 섹션에
//    격리 + 출력 JSON 계약 재확인, (5) 파서 출력은 기존 Zod로 검증 + 사용자 확인 단계가 있어
//    blast radius가 본인 커플로 한정된다. 아래 캡 상수는 UI/서버가 공유한다.

// ── A. 지출 분석 ──

export type AiTone = 'friendly' | 'concise' | 'strict';
export type AiFocus = 'saving' | 'investment' | 'balanced';
export type AiLength = 'short' | 'normal' | 'detailed';

export type AnalyzeSpendingPrefs = {
  enabled: boolean;
  tone: AiTone;
  focus: AiFocus;
  length: AiLength;
};

// ── B. 현금흐름 예측 ──

export type PredictionStance = 'conservative' | 'standard' | 'aggressive';

export type CashflowPredictionPrefs = {
  enabled: boolean;
  stance: PredictionStance;
  /** 예측에서 제외할 카테고리 이름들(커플 카테고리에서 선택). */
  excludedCategories: string[];
};

// ── C. 거래 파싱 ──

/** 가맹점/키워드 → 카테고리 매핑 규칙. category는 커플 카테고리 중 하나. */
export type CategoryRule = {
  match: string;
  category: string;
};

export type ParseEntriesPrefs = {
  enabled: boolean;
  categoryRules: CategoryRule[];
  /** 단순 이체(isTransfer)로 표시할 키워드. */
  transferKeywords: string[];
};

// ── 전체 ──

export type AiPreferences = {
  analyzeSpending: AnalyzeSpendingPrefs;
  cashflowPrediction: CashflowPredictionPrefs;
  parseEntries: ParseEntriesPrefs;
};

// ── 옵션 메타(라벨/설명) ──

export type AiPreferenceOption<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export const AI_TONE_OPTIONS: AiPreferenceOption<AiTone>[] = [
  { value: 'friendly', label: '친근하게', description: '다정하고 격려하는 말투' },
  { value: 'concise', label: '간결하게', description: '핵심만 짧고 담백하게' },
  { value: 'strict', label: '엄격하게', description: '냉정하게 문제점 위주로 짚기' },
];

export const AI_FOCUS_OPTIONS: AiPreferenceOption<AiFocus>[] = [
  { value: 'saving', label: '절약 중심', description: '아낄 수 있는 지출을 먼저' },
  { value: 'investment', label: '자산 형성', description: '저축·투자 여력을 먼저' },
  { value: 'balanced', label: '균형', description: '수입·지출을 고르게' },
];

export const AI_LENGTH_OPTIONS: AiPreferenceOption<AiLength>[] = [
  { value: 'short', label: '짧게', description: '요점만 3~4줄' },
  { value: 'normal', label: '보통', description: '기본 분량' },
  { value: 'detailed', label: '자세히', description: '항목별 근거까지 자세히' },
];

export const AI_PREDICTION_STANCE_OPTIONS: AiPreferenceOption<PredictionStance>[] = [
  { value: 'conservative', label: '보수적', description: '적게, 낮은 확신으로 예측' },
  { value: 'standard', label: '표준', description: '평소 패턴 그대로' },
  { value: 'aggressive', label: '적극적', description: '더 많이, 높은 확신으로 예측' },
];

// ── 입력 캡(UI maxLength / 서버 검증 공유) ──

export const MAX_CATEGORY_RULES = 20;
export const MAX_RULE_MATCH_LEN = 40;
export const MAX_TRANSFER_KEYWORDS = 20;
export const MAX_TRANSFER_KEYWORD_LEN = 20;

// ── 기본값 ──

export const DEFAULT_ANALYZE_SPENDING: AnalyzeSpendingPrefs = {
  enabled: false,
  tone: 'friendly',
  focus: 'balanced',
  length: 'normal',
};

export const DEFAULT_CASHFLOW_PREDICTION: CashflowPredictionPrefs = {
  enabled: false,
  stance: 'standard',
  excludedCategories: [],
};

export const DEFAULT_PARSE_ENTRIES: ParseEntriesPrefs = {
  enabled: false,
  categoryRules: [],
  transferKeywords: [],
};

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  analyzeSpending: DEFAULT_ANALYZE_SPENDING,
  cashflowPrediction: DEFAULT_CASHFLOW_PREDICTION,
  parseEntries: DEFAULT_PARSE_ENTRIES,
};
