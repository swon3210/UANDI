import type { Timestamp } from 'firebase/firestore';

// ── 가계부 관련 타입: @uandi/cashbook-core에서 re-export ──
export type {
  CashbookEntry,
  CashbookEntryType,
  CashbookCategory,
  CategoryGroup,
  CategorySubGroup,
} from '@uandi/cashbook-core';

// ── 앱 전용 타입 ──

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
  parentFolderId: string | null;
  depth: number;
  path: string[];
};

export const MAX_FOLDER_DEPTH = 4;

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

export type AnnualPlan = {
  id: string;
  coupleId: string;
  year: number;
  createdBy: string;
  updatedAt: Timestamp;
  createdAt: Timestamp;
};

export type AnnualPlanItem = {
  id: string;
  planId: string;
  coupleId: string;
  categoryId: string;
  group: import('@uandi/cashbook-core').CategoryGroup;
  subGroup: import('@uandi/cashbook-core').CategorySubGroup;
  annualAmount: number;
  monthlyAmount: number | null;
  targetMonths: number[] | null;
  ownerUid: string | null;
  updatedAt: Timestamp;
};

export type InvestmentPlan = {
  id: string;
  planId: string;
  coupleId: string;
  targetReturnRate: number;
  totalAvailable: number;
  targetAmount: number;
  updatedAt: Timestamp;
};

// 투자 항목 (CashbookEntry 확장)
export type InvestmentEntry = import('@uandi/cashbook-core').CashbookEntry & {
  type: 'investment';
  transactionType: 'buy' | 'sell';
};

// 월별 예산 스냅샷 (연간 계획에서 자동 생성)
export type MonthlyBudget = {
  id: string;
  coupleId: string;
  planId: string;
  year: number;
  month: number; // 1~12
  items: MonthlyBudgetItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MonthlyBudgetItem = {
  categoryId: string;
  group: import('@uandi/cashbook-core').CategoryGroup;
  subGroup: import('@uandi/cashbook-core').CategorySubGroup;
  budgetAmount: number;
  ownerUid: string | null;
};

// 알림 설정
export type NotificationSettings = {
  coupleId: string;
  userId: string;
  recordReminder: {
    enabled: boolean;
    time: string; // "21:00" (HH:mm)
    days: number[]; // [1, 2, 3, 4, 5] (1=월, 7=일)
  };
  budgetWarning: {
    enabled: boolean;
  };
  updatedAt: Timestamp;
};

// 가계부 디스플레이 설정 (유저 개인)
export type CashbookDisplaySettings = {
  userId: string;
  backgroundImageUrl: string | null;
  updatedAt: Timestamp;
};

// 현금 보유 잔고 (월말 스냅샷)
export type CashBalance = {
  id: string;
  coupleId: string;
  categoryId: string;
  year: number;
  month: number;
  balance: number;
  updatedAt: Timestamp;
};
