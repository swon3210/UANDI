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

// ── 재테크 자산 배분 목표 비율 (개인 소유) ──
// 저장 경로: couples/{coupleId}/sideHustles/{uid}/config/assetAllocation
// 본인만 읽기/쓰기 (재테크 sideHustles 규칙 그대로 적용). 세 값의 합은 100이어야 한다.
export type AssetAllocationRatio = {
  uid: string;
  coupleId: string;
  cash: number; // 현금 % (0~100 정수)
  savings: number; // 예적금 % (0~100 정수)
  investment: number; // 투자 % (0~100 정수)
  updatedAt: Timestamp;
};

// 자산 배분 비율 입력값 (합계 100 강제 전, UI/서비스 공용)
export type AssetAllocationInput = Pick<AssetAllocationRatio, 'cash' | 'savings' | 'investment'>;

export const DEFAULT_ASSET_ALLOCATION: AssetAllocationInput = {
  cash: 10,
  savings: 50,
  investment: 40,
};

// ── 커뮤니티 (전역 공유 공간 — couples/ 격리 예외) ──
// 자세히는 docs/pages/community/community-feed.md, docs/08-spaces.md 참고.

export type CommunityPostType = 'user' | 'scraped';
export type CommunityPostStatus = 'published' | 'pending' | 'hidden';

export type CommunityPostAuthor = {
  uid: string;
  coupleId: string | null;
  displayName: string; // 작성 시점 프로필명 스냅샷
  photoURL: string | null;
};

export type CommunityPostSource = {
  siteName: string;
  url: string; // 원문 링크(링크아웃 대상)
  ogImageUrl: string | null; // OG 이미지 URL — 우리 서버에 복제하지 않음
  originPublishedAt: Timestamp | null;
  sourceId: string; // 정규화 URL의 해시 — 중복 수집 방지 키
};

export type CommunityPost = {
  id: string;
  type: CommunityPostType;
  status: CommunityPostStatus;

  // 공통 표시
  title: string; // user: 빈 문자열 허용 / scraped: 원문 제목
  body: string; // user: 본문 / scraped: 짧은 발췌 또는 ''
  createdAt: Timestamp;
  publishedAt: Timestamp | null; // 노출 시각(정렬 키). pending이면 null
  reportCount: number; // 트리거로 갱신 (Phase 4)

  // type === 'user' 전용
  author?: CommunityPostAuthor;
  imageUrl?: string | null;

  // type === 'scraped' 전용
  source?: CommunityPostSource;
};
