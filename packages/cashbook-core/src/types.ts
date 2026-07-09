import type { Timestamp } from 'firebase/firestore';

export type CashbookEntryType = 'income' | 'expense' | 'flex';

export type CashbookEntry = {
  id: string;
  coupleId: string;
  createdBy: string;
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
};

export type CategoryGroup = 'income' | 'expense' | 'flex';

export type CategorySubGroup =
  // 수입
  | 'regular_income'
  | 'irregular_income'
  // 지출
  | 'fixed_expense'
  | 'variable_common'
  | 'variable_personal'
  // Flex
  | 'joint_flex'
  | 'personal_flex';

export type RecurringScheduleKind = 'dayOfMonth' | 'nthWeekday';

/** 카테고리의 정기 발생 주기. fixed_expense / regular_income 카테고리에만 설정한다. */
export type RecurringSchedule = {
  /** 정기 알림 on/off. false면 발생일 데이터는 보존하되 알림을 보내지 않는다. */
  enabled: boolean;
  /** 발생일 지정 방식 */
  kind: RecurringScheduleKind;
  /** kind === 'dayOfMonth': 1~31. 해당 월에 그 날이 없으면 그 달 마지막 날로 clamp. */
  dayOfMonth?: number;
  /** kind === 'nthWeekday': 몇째 주(1~5, 또는 -1=마지막 주). */
  week?: 1 | 2 | 3 | 4 | 5 | -1;
  /** kind === 'nthWeekday': 요일(1=월 ~ 7=일). */
  weekday?: number;
  /** 발생일 며칠 전에 알림을 보낼지. 0 = 당일. 0~7. 미지정 시 0. */
  leadDays?: number;
  /** 예상 금액(선택). 있으면 알림 본문에 노출. */
  expectedAmount?: number | null;
  /**
   * 반복 주기(개월). 1=매월(기본), 2=격월, 3=분기, 6=반기, 12=매년.
   * 미지정 시 1로 간주(기존 데이터 하위호환 — 매월 발생).
   */
  intervalMonths?: number;
  /**
   * 주기 위상 기준 달("YYYY-MM"). intervalMonths > 1일 때 이 달과 같은 위상의 달에만 발생한다.
   * 예: intervalMonths=2, anchorMonth='2026-07' → 7·9·11월…(홀수 위상)에만 발생, 짝수달은 건너뜀.
   * 미지정 시 절대 월 인덱스 기준 위상 0으로 폴백(결정적).
   */
  anchorMonth?: string;
};

export type CashbookCategory = {
  id: string;
  coupleId: string;
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  /** 부모 카테고리 id. null이면 본인이 부모(레벨 1), 값이 있으면 자식(레벨 2). 자식은 자식을 가질 수 없다. */
  parentCategoryId: string | null;
  /** 카테고리 용도 설명. 입력 시 hint로 노출. 빈 문자열 허용. */
  description: string;
  /** 이 카테고리에 해당하는 항목 예시 목록. 입력 메모와 매칭해 자동 추천에도 사용. */
  examples: string[];
  /** 정기 발생 주기. fixed_expense / regular_income에서만 설정. 미설정이면 정기 알림 없음. */
  recurrence?: RecurringSchedule | null;
  /** 정기 발생 등록 제안을 닫았는지(읽기 시점 제안 재노출 방지). Phase 6. */
  recurrenceSuggestionDismissed?: boolean;
  createdAt: Timestamp;
};

// ── 현금흐름 캘린더 예측 (저장 경로: couples/{coupleId}/cashbookPredictions/{predictionId}) ──
// 명세: docs/spec — 현금흐름 캘린더. 가계부(cashbookEntries)와 분리된 별도 컬렉션이라
// 대시보드·결산·내역의 기존 쿼리는 예측을 절대 보지 않는다(§11 대시보드 비간섭 구조적 보장).

/**
 * 예측 상태(§6).
 * - predicted: ◇ 미확정. 캘린더 잔액 포함, 가계부에 점선 V/X 프롬프트.
 * - rejected: ✗ 거절. 가계부 프롬프트 제거. calendar 출처는 캘린더에 잔존, auto 출처는 삭제(시나리오 B).
 * - confirmed: ✓ 확정. linkedEntryId로 실거래(cashbookEntries) 생성됨. 캘린더는 ✓로 표시, 잔액은 실거래로 계산.
 */
export type PredictionStatus = 'predicted' | 'rejected' | 'confirmed';

/**
 * 예측 출처.
 * - calendar: 사용자가 캘린더에서 직접 생성(레거시 — 수동 추가 UI는 폐지됨).
 * - auto: 고정지출 자동감지(§7-1, Phase 5에서 제거됨 — 잔존 doc은 조회 단계 비활성).
 * - llm: 과거 소비/수입 패턴 기반 LLM 예측(읽기 시점 파생, 표시 전용·잔액 미반영).
 */
export type PredictionSource = 'calendar' | 'auto' | 'llm';

export type CashbookPrediction = {
  id: string;
  coupleId: string;
  createdBy: string;
  source: PredictionSource;
  status: PredictionStatus;
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  /** 예측 발생 예정일 */
  date: Timestamp;
  /** 자동감지 패턴 식별 키(`${category}|${type}|${dayOfMonth}` 정규화). 재제안 게이트(§7-1)·30일 거절(SYNC-04)에 사용. calendar 출처는 null. */
  recurrenceKey: string | null;
  /** 신뢰도 0~1. calendar 출처는 1. confidence 학습(§7-3)은 v1.1. */
  confidence: number;
  /** ✗ 거절 시 now+30d. 같은 recurrenceKey는 이 시각 이전엔 재제안 금지(SYNC-04). */
  rejectedUntil: Timestamp | null;
  /** ✓ 확정 시 생성된 cashbookEntry id(SYNC-03). 미확정이면 null. */
  linkedEntryId: string | null;
  /**
   * 가계부 점선 프롬프트만 닫혔는지(SYNC-04). calendar 출처를 ✗하면 true가 되어
   * 가계부에선 사라지지만 status는 'predicted' 그대로라 캘린더에는 잔존한다.
   * (auto 출처 ✗는 status='rejected'로 양쪽에서 제거 — 시나리오 B.)
   */
  promptDismissed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
