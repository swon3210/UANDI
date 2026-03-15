import type { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  coupleId: string | null;
  createdAt: Timestamp;
};

export type Couple = {
  id: string;
  memberUids: string[]; // 생성 시 1명, 커플 연결 완료 후 2명
  inviteCode: string;
  inviteCodeExpiresAt: Timestamp;
  createdAt: Timestamp;
};

export type Folder = {
  id: string;
  coupleId: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
};

export type Photo = {
  id: string;
  coupleId: string;
  uploadedBy: string;
  folderId: string;
  tags: string[];
  storageUrl: string;
  thumbnailUrl: string | null;
  caption: string;
  takenAt: Timestamp;
  uploadedAt: Timestamp;
  width: number;
  height: number;
};

export type CashbookEntryType = 'income' | 'expense' | 'investment' | 'flex';

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

export type CategoryGroup = 'income' | 'expense' | 'investment' | 'flex';

export type CategorySubGroup =
  // 수입
  | 'regular_income'
  | 'irregular_income'
  // 지출
  | 'fixed_expense'
  | 'variable_common'
  | 'variable_personal'
  // 재테크
  | 'cash_holding'
  | 'investment'
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
  createdAt: Timestamp;
};

export const EXPENSE_CATEGORIES = [
  '식비',
  '교통',
  '쇼핑',
  '의료',
  '문화/여가',
  '주거/관리비',
  '통신',
  '보험',
  '저축',
  '기타',
] as const;

export const INCOME_CATEGORIES = ['월급', '용돈', '부수입', '기타'] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
