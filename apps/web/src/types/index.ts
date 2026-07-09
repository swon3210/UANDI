import type { Timestamp } from 'firebase/firestore';

// ── 가계부 관련 타입: @uandi/cashbook-core에서 re-export ──
export type {
  CashbookEntry,
  CashbookEntryType,
  CashbookCategory,
  CategoryGroup,
  CategorySubGroup,
  RecurringSchedule,
  RecurringScheduleKind,
  CashbookPrediction,
  PredictionStatus,
  PredictionSource,
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
  createdAt: Timestamp;
};

// 초대 코드 인덱스 (couples/ 격리 예외 — 최상위 컬렉션)
// 저장 경로: inviteCodes/{code}
// - code는 문서 id 자체 (6자리 대문자 영숫자)
// - createdBy의 자기 자신 합류 불가
// - consumedBy != null이면 합류 완료(만석)
export type InviteCode = {
  code: string;
  coupleId: string;
  createdBy: string;
  expiresAt: Timestamp;
  consumedBy: string | null;
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

// ── 월 결산 (저장 경로: couples/{coupleId}/cashbookSettlements/{YYYY-MM}) ──
// 월별 단일 문서. 결정적 ID(월 키)로 전체 스캔 없이 조회한다.
// - draft: 라이브 내역으로 작업 중. attachments(영수증·스크린샷)는 완료 전까지 유지.
// - completed: report 스냅샷이 박제되고 attachments는 비워진다.
//   "다시 결산하기"로 draft로 되돌려 재작성하면 report를 덮어쓴다.

export type SettlementStatus = 'draft' | 'completed';

// 첨부 이미지 분류 (계좌 내역 / 카드 내역)
export type SettlementImageKind = 'account' | 'card';

// 결산 작업 중 첨부한 영수증·스크린샷 (완료 시 Storage에서 삭제)
export type SettlementAttachment = {
  id: string;
  storagePath: string; // couples/{coupleId}/cashbookSettlements/{YYYY-MM}/{id}.{ext}
  url: string; // downloadURL
  name: string; // 원본 파일명
  kind?: SettlementImageKind; // 첨부 분류 (구버전 데이터엔 없을 수 있어 optional — 없으면 계좌로 취급)
  // 일괄 분석 후 채워지는, 이 이미지가 담고 있는 거래의 월 집합 (YYYY-MM, 정렬됨).
  // 한 장에 6·7월이 섞여 있으면 ['2026-06','2026-07']. 갤러리 정렬·월 칩 표시에 사용.
  detectedMonths?: string[];
  createdAt: Timestamp;
};

// 결산 완료 시 박제되는 보고서 스냅샷 (차트 데이터 사전 계산 — 재조회 시 내역 쿼리 불필요)
export type SettlementReportSnapshot = {
  totals: { income: number; expense: number; flex: number };
  spending: number; // expense + flex (지출 분석 기준값)
  budgetCeiling: number; // 완료 시점 (지출+FLEX) 예산 합
  spentPct: number | null;
  barData: { category: string; budget: number; actual: number }[]; // 예산 대비 실적
  pieData: { name: string; value: number }[]; // 수입/지출/FLEX 슬라이스
  dailyData: { day: number; cumulative: number | null }[]; // 일별 누적 (지출+FLEX)
  aiAnalysis: string; // 캡처한 AI 분석 마크다운 ('' 가능)
  entryCount: number;
  completedAt: Timestamp;
};

export type CashbookSettlement = {
  id: string; // 'YYYY-MM' (== month key, month는 1-indexed)
  coupleId: string;
  year: number;
  month: number; // 1~12 (id와 일치)
  status: SettlementStatus;
  attachments: SettlementAttachment[]; // draft에만 존재, 완료 시 []
  report: SettlementReportSnapshot | null; // 완료 시에만 채워짐
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
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
  // 고정 지출·수입 정기 알림 on/off. 미지정 시 true 취급(기존 유저 호환).
  recurringTransaction?: {
    enabled: boolean;
  };
  // 파트너의 가계부 입력 요청("콕 찌르기") 알림 on/off. 미지정 시 true 취급(기존 유저 호환).
  recordRequest?: {
    enabled: boolean;
  };
  updatedAt: Timestamp;
};

// 가계부 입력 요청 "콕 찌르기" (docs/pages/inner/cashbook-nudge.md)
export type NudgeType = 'record-request';
export type NudgeStatus = 'pending' | 'seen' | 'done' | 'dismissed';

export type Nudge = {
  id: string;
  coupleId: string;
  fromUid: string; // 보낸 사람
  toUid: string; // 받는 사람 (파트너)
  type: NudgeType;
  message: string; // 프리셋 or 커스텀 (빈 문자열 허용)
  status: NudgeStatus;
  createdAt: Timestamp;
  respondedAt: Timestamp | null;
};

// 가계부 디스플레이 설정 (유저 개인)
export type CashbookDisplaySettings = {
  userId: string;
  backgroundImageUrl: string | null;
  updatedAt: Timestamp;
};

// ── 현금흐름 캘린더 설정 (커플 공동) ──
// 저장 경로: couples/{coupleId}/meta/cashflow (단일 문서 — 결정적 ID로 전체 스캔 회피)
// 결제일 목록 + 현재 보유 현금 + 변동지출 추정 기간을 한 문서에 보관한다.

export type CashflowPaydayType = 'card' | 'loan' | 'rent' | 'custom';

export type CashflowPayday = {
  id: string; // crypto.randomUUID()
  /**
   * 큰 지출이 빠지는 '지출 이벤트' 이름 (예: 월세, 관리비, 대출이자, 카드값).
   * 결제 수단(카드 이름)이 아니라 '무슨 돈이 빠지는 날'을 가리킨다.
   */
  label: string;
  /** 내부 호환용(아이콘/분류). UI에서는 더 이상 노출하지 않는다. */
  type?: CashflowPaydayType;
  dayOfMonth: number; // 1~31 (해당 월에 없는 날이면 말일로 clamp)
};

export type CashflowSettings = {
  coupleId: string;
  /** §9-2 잔액 계산 시작점("현재 보유 현금"). */
  currentCash: number;
  /** 비어 있으면 캘린더는 주 단위로 묶어서 표시(§9-1). */
  paydays: CashflowPayday[];
  /** @deprecated 변동지출은 "AI 예상 내역"으로 일원화됨. 레거시 저장 문서 호환용으로만 잔존. */
  variableMode?: 1 | 3 | 6;
  updatedAt: Timestamp;
};

// ── 재테크 자산 배분 목표 비율 (개인 소유) ──
// 저장 경로: couples/{coupleId}/sideHustles/{uid}/config/assetAllocation
// 본인만 읽기/쓰기 (재테크 sideHustles 규칙 그대로 적용). 모든 값의 합은 100이어야 한다.
export type AssetAllocationRatio = {
  uid: string;
  coupleId: string;
  savings: number; // 예적금 % (0~100 정수)
  stocks: number; // 주식 % (0~100 정수)
  realEstate: number; // 부동산 % (0~100 정수)
  crypto: number; // 코인 % (0~100 정수)
  forex: number; // 외환 % (0~100 정수)
  updatedAt: Timestamp;
};

// 자산 배분 비율 입력값 (합계 100 강제 전, UI/서비스 공용)
export type AssetAllocationInput = Pick<
  AssetAllocationRatio,
  'savings' | 'stocks' | 'realEstate' | 'crypto' | 'forex'
>;

export const DEFAULT_ASSET_ALLOCATION: AssetAllocationInput = {
  savings: 30,
  stocks: 30,
  realEstate: 25,
  crypto: 5,
  forex: 10,
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
  editedAt?: Timestamp | null; // 본인 수정 시각. 없거나 null이면 미수정('수정됨' 마커 판정)
  reportCount: number; // 트리거로 갱신 (Phase 4)

  // type === 'user' 전용
  author?: CommunityPostAuthor;
  imageUrl?: string | null;

  // type === 'scraped' 전용
  source?: CommunityPostSource;
};

// ── 커뮤니티 크롤 소스 (전역 — 어드민 관리, Admin SDK/서버만 write) ──
// 저장 경로: communitySources/{sourceId}
// 크롤러(스케줄/수동)가 enabled==true인 소스의 RSS/Atom 피드만 수집한다.
// 법적 가드레일: 피드의 메타데이터(제목·링크·발췌·OG이미지 URL)만 저장, 원문/이미지 복제 금지.
export type CommunitySource = {
  id: string;
  siteName: string; // 출처 표시명 (scraped 카드 source.siteName으로 사용)
  feedUrl: string; // RSS/Atom 피드 URL
  enabled: boolean; // false면 크롤 스킵
  createdAt: Timestamp;
  lastCrawledAt: Timestamp | null; // 마지막 수집 시각 (운영 가시성)
  lastError: string | null; // 마지막 크롤 에러 메시지 (운영 가시성)
};
