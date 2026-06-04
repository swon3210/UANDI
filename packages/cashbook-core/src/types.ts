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
  createdAt: Timestamp;
};
