// 스토어 스크린샷용 데모 데이터 시드.
// E2E 헬퍼(helpers/emulator.ts)를 재사용해 Firebase 에뮬레이터에 현실감 있는
// 가계부/현금흐름/자산배분/커뮤니티 데이터를 채운다. 실제 사용자 데이터는 건드리지 않는다.
import {
  seedDefaultCategories,
  seedCashbookEntry,
  seedCashflowSettings,
  seedPrediction,
  seedAssetAllocation,
  seedCommunityPost,
  seedCouplePresence,
  seedAnnualPlan,
  seedAnnualPlanItem,
  seedAnnualPlanRevision,
  listCategories,
} from '../helpers/emulator';

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY).toISOString();
const daysAhead = (n: number) => new Date(now + n * DAY).toISOString();

/**
 * 스토어 이미지는 "지난달" 화면을 찍는다(이번 달은 날짜에 따라 비어 보일 수 있다).
 * monthsAgo=1이 지난달. 날짜는 그 달의 day일 정오(로컬)로 만든다.
 */
function dateIn(monthsAgo: number, day: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

type Entry = {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  day: number;
  by: 1 | 2;
};

/** 매달 반복되는 고정 수입·지출 */
const FIXED: Entry[] = [
  {
    type: 'income',
    amount: 3_200_000,
    category: '정기급여',
    description: '지수 급여',
    day: 25,
    by: 1,
  },
  {
    type: 'income',
    amount: 2_800_000,
    category: '정기급여',
    description: '현우 급여',
    day: 25,
    by: 2,
  },
  { type: 'expense', amount: 850_000, category: '월세', description: '월세', day: 1, by: 1 },
  { type: 'expense', amount: 180_000, category: '보험', description: '실비보험', day: 10, by: 2 },
];

/** 지난달 생활 지출 — 대시보드의 카테고리 분포·최근 내역이 자연스럽게 보이도록 촘촘하게 */
const LAST_MONTH: Entry[] = [
  {
    type: 'expense',
    amount: 55_000,
    category: '교통',
    description: '교통카드 충전',
    day: 2,
    by: 2,
  },
  {
    type: 'expense',
    amount: 68_000,
    category: '식비',
    description: '이마트 장보기',
    day: 3,
    by: 1,
  },
  { type: 'expense', amount: 9_000, category: '식비', description: '점심 김치찌개', day: 5, by: 2 },
  { type: 'expense', amount: 24_000, category: '식비', description: '배달 치킨', day: 8, by: 1 },
  { type: 'expense', amount: 32_000, category: '소비', description: '영화 데이트', day: 9, by: 2 },
  { type: 'expense', amount: 51_000, category: '식비', description: '주말 외식', day: 12, by: 1 },
  { type: 'expense', amount: 15_000, category: '교통', description: '퇴근길 택시', day: 14, by: 2 },
  {
    type: 'expense',
    amount: 240_000,
    category: '여행',
    description: '제주 항공권',
    day: 16,
    by: 1,
  },
  {
    type: 'expense',
    amount: 47_000,
    category: '식비',
    description: '코스트코 장보기',
    day: 17,
    by: 2,
  },
  { type: 'income', amount: 300_000, category: '부업', description: '블로그 수익', day: 18, by: 1 },
  { type: 'expense', amount: 12_500, category: '식비', description: '카페', day: 19, by: 1 },
  {
    type: 'expense',
    amount: 120_000,
    category: '소비',
    description: '부모님 생신 선물',
    day: 21,
    by: 2,
  },
  { type: 'expense', amount: 43_000, category: '식비', description: '저녁 외식', day: 23, by: 2 },
  { type: 'expense', amount: 39_000, category: '식비', description: '마트 장보기', day: 27, by: 1 },
];

/** 그 전 두 달 — 기간 비교 추세용으로 조금만 */
const EARLIER: Entry[] = [
  {
    type: 'expense',
    amount: 60_000,
    category: '교통',
    description: '교통카드 충전',
    day: 2,
    by: 2,
  },
  { type: 'expense', amount: 82_000, category: '식비', description: '장보기', day: 6, by: 1 },
  { type: 'expense', amount: 64_000, category: '식비', description: '외식', day: 15, by: 2 },
  { type: 'expense', amount: 89_000, category: '소비', description: '데이트', day: 20, by: 1 },
  { type: 'expense', amount: 53_000, category: '식비', description: '배달', day: 26, by: 2 },
];

const ENTRIES: Array<Entry & { monthsAgo: number }> = [
  ...[1, 2, 3].flatMap((m) => FIXED.map((e) => ({ ...e, monthsAgo: m }))),
  ...LAST_MONTH.map((e) => ({ ...e, monthsAgo: 1 })),
  ...[2, 3].flatMap((m) => EARLIER.map((e) => ({ ...e, monthsAgo: m }))),
];

/** 올해 예산(경제 목표 화면) — 카테고리 이름 → 월별 금액 */
const PLAN: Record<string, number[]> = {
  정기급여: Array(12).fill(6_000_000),
  상여: [0, 0, 0, 0, 0, 0, 0, 0, 2_000_000, 0, 0, 0],
  부업: Array(12).fill(300_000),
  월세: Array(12).fill(850_000),
  보험: Array(12).fill(180_000),
  식비: Array(12).fill(600_000),
  교통: Array(12).fill(120_000),
  여행: [0, 0, 0, 0, 0, 0, 1_500_000, 0, 0, 0, 0, 0],
  소비: Array(12).fill(300_000),
};

export async function seedDemoData(coupleId: string, uid1: string, uid2: string): Promise<void> {
  await seedDefaultCategories(coupleId);

  for (const e of ENTRIES) {
    await seedCashbookEntry(coupleId, e.by === 1 ? uid1 : uid2, {
      type: e.type,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: dateIn(e.monthsAgo, e.day),
    });
  }

  // 커플 카드: 둘 다 접속 중 + 한마디
  const nowIso = new Date().toISOString();
  await seedCouplePresence(coupleId, {
    [uid1]: {
      lastSeenIso: nowIso,
      message: '이번 달 외식 조금만 줄여보자 💪',
      messageUpdatedAtIso: nowIso,
    },
    [uid2]: {
      lastSeenIso: nowIso,
      message: '주말에 장 같이 보러 가자',
      messageUpdatedAtIso: nowIso,
    },
  });

  // 올해 예산 + 위저드 완료(리비전) → 대시보드 권유 카드 대신 경제 목표가 채워진다
  const year = new Date().getFullYear();
  const planId = await seedAnnualPlan(coupleId, year, uid1);
  const categories = await listCategories(coupleId);
  for (const c of categories) {
    const amounts = PLAN[c.name] ?? Array(12).fill(0);
    await seedAnnualPlanItem(coupleId, planId, {
      categoryId: c.id,
      group: c.group as 'income' | 'expense',
      subGroup: c.subGroup,
      monthlyAmounts: amounts,
      inputMode:
        c.subGroup === 'regular_income' || c.subGroup === 'fixed_expense' ? 'regular' : 'irregular',
      baseMonthlyAmount: amounts.every((v) => v === amounts[0]) ? amounts[0] : null,
    });
  }
  await seedAnnualPlanRevision(coupleId, planId, uid1);

  // 현금흐름 캘린더: 보유 현금 + 급여일 + 다가오는 예측들
  await seedCashflowSettings(coupleId, {
    currentCash: 5_240_000,
    variableMode: 3,
    paydays: [{ id: 'pay-1', label: '급여일', dayOfMonth: 25 }],
  });
  const predictions: Array<{
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    ahead: number;
  }> = [
    { type: 'income', amount: 3_200_000, category: '정기급여', description: '지수 급여', ahead: 7 },
    { type: 'income', amount: 2_800_000, category: '정기급여', description: '현우 급여', ahead: 7 },
    { type: 'expense', amount: 850_000, category: '월세', description: '월세', ahead: 12 },
    { type: 'expense', amount: 180_000, category: '보험', description: '실비보험', ahead: 4 },
    { type: 'expense', amount: 160_000, category: '식비', description: '예상 식비', ahead: 2 },
  ];
  for (const p of predictions) {
    await seedPrediction(coupleId, uid1, {
      type: p.type,
      amount: p.amount,
      category: p.category,
      description: p.description,
      date: daysAhead(p.ahead),
      status: 'predicted',
    });
  }

  // 재테크: 자산 배분 목표 비율 (로그인 사용자 소유)
  await seedAssetAllocation(coupleId, uid1, {
    savings: 40,
    stocks: 30,
    realEstate: 20,
    crypto: 5,
    forex: 5,
  });

  // 커뮤니티: 게시된 글 (유저글 + 스크랩글 혼합)
  await seedCommunityPost({
    type: 'user',
    status: 'published',
    title: '신혼집 가계부 드디어 정착했어요',
    body: '둘이 따로 쓰던 가계부를 합치니 한 달 지출이 한눈에 보여서 좋네요. 현금흐름 캘린더로 다음 달 카드값까지 미리 보여서 든든해요.',
    publishedAt: daysAgo(1),
    author: { uid: uid1, coupleId, displayName: '지수' },
  });
  await seedCommunityPost({
    type: 'scraped',
    status: 'published',
    title: '신혼부부 특별공급, 2024년 달라진 점 총정리',
    publishedAt: daysAgo(2),
    source: { siteName: '부동산인사이트', url: 'https://example.com/news/1', sourceId: 'src-1' },
  });
  await seedCommunityPost({
    type: 'user',
    status: 'published',
    title: '혼수 예산 얼마가 적당할까요?',
    body: '예단/예물 빼고 가전·가구만 잡으려는데 다들 얼마 정도 쓰셨나요? 후기 부탁드려요!',
    publishedAt: daysAgo(3),
    author: { uid: uid2, coupleId, displayName: '현우' },
  });
  await seedCommunityPost({
    type: 'scraped',
    status: 'published',
    title: '맞벌이 부부 연말정산 절세 꿀팁 7가지',
    publishedAt: daysAgo(4),
    source: { siteName: '머니레터', url: 'https://example.com/news/2', sourceId: 'src-2' },
  });
  await seedCommunityPost({
    type: 'user',
    status: 'published',
    title: '신혼여행 경비 이렇게 정산했어요',
    body: '여행 동안 쓴 돈을 여행 카테고리로 묶어두니 정산이 깔끔하더라고요. 카드별로 누가 얼마 썼는지도 자동으로 나뉘어요.',
    publishedAt: daysAgo(6),
    author: { uid: uid1, coupleId, displayName: '지수' },
  });
}
