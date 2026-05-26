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
  /** 길이 12 (1월=index 0). Source of truth. */
  monthlyAmounts: number[];
  inputMode: 'regular' | 'irregular';
  /** regular 모드의 단일 월 평균 (재진입 시 UI 복원용) */
  baseMonthlyAmount: number | null;
  /** = sum(monthlyAmounts), write 시 동기화 */
  annualAmount: number;
  ownerUid: string | null;
  updatedAt: Timestamp;
};

export type AnnualPlanRevision = {
  id: string;
  planId: string;
  coupleId: string;
  source: 'wizard_initial' | 'wizard_redo' | 'bulk_edit';
  createdBy: string;
  createdAt: Timestamp;
  /** itemId → number[12] 풀 스냅샷 */
  before: Record<string, number[]>;
  after: Record<string, number[]>;
  totals: {
    before: { income: number; expense: number; flex: number };
    after: { income: number; expense: number; flex: number };
  };
};

// 월별 예산 스냅샷 (연간 계획에서 on-the-fly 산출)
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

// FCM 푸시 토큰 (다중 디바이스 지원)
export type FcmTokenPlatform = 'web' | 'android' | 'ios';

export type FcmToken = {
  id: string; // 토큰 자체의 SHA 해시 또는 토큰 prefix를 id로 사용
  userId: string;
  token: string; // FCM registration token
  userAgent: string;
  platform?: FcmTokenPlatform;
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
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
    // 본인 지출로 인해 발생한 예산 경고를 in-app toast로 띄울지 여부. 미지정 시 true 취급.
    selfAlertInApp?: boolean;
  };
  updatedAt: Timestamp;
};

// 가계부 디스플레이 설정 (유저 개인)
export type CashbookDisplaySettings = {
  userId: string;
  backgroundImageUrl: string | null;
  updatedAt: Timestamp;
};

