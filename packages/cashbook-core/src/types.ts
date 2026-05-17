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
  createdAt: Timestamp;
};
