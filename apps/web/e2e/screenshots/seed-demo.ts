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
} from '../helpers/emulator';

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY).toISOString();
const daysAhead = (n: number) => new Date(now + n * DAY).toISOString();

type Entry = {
  type: 'income' | 'expense' | 'flex';
  amount: number;
  category: string;
  description: string;
  ageDays: number;
  by: 1 | 2;
};

// 최근 ~80일에 걸친 거래 — 3개월 추세 + 카테고리 분포가 보이도록 구성
const ENTRIES: Entry[] = [
  // 수입
  {
    type: 'income',
    amount: 3_200_000,
    category: '정기급여',
    description: '지수 급여',
    ageDays: 5,
    by: 1,
  },
  {
    type: 'income',
    amount: 2_800_000,
    category: '정기급여',
    description: '현우 급여',
    ageDays: 5,
    by: 2,
  },
  {
    type: 'income',
    amount: 3_200_000,
    category: '정기급여',
    description: '지수 급여',
    ageDays: 35,
    by: 1,
  },
  {
    type: 'income',
    amount: 2_800_000,
    category: '정기급여',
    description: '현우 급여',
    ageDays: 35,
    by: 2,
  },
  {
    type: 'income',
    amount: 3_200_000,
    category: '정기급여',
    description: '지수 급여',
    ageDays: 65,
    by: 1,
  },
  {
    type: 'income',
    amount: 300_000,
    category: '부업',
    description: '블로그 수익',
    ageDays: 18,
    by: 1,
  },
  // 고정 지출
  {
    type: 'expense',
    amount: 850_000,
    category: '월세',
    description: '6월 월세',
    ageDays: 10,
    by: 1,
  },
  {
    type: 'expense',
    amount: 850_000,
    category: '월세',
    description: '5월 월세',
    ageDays: 40,
    by: 1,
  },
  {
    type: 'expense',
    amount: 850_000,
    category: '월세',
    description: '4월 월세',
    ageDays: 70,
    by: 1,
  },
  {
    type: 'expense',
    amount: 180_000,
    category: '보험',
    description: '실비보험',
    ageDays: 8,
    by: 2,
  },
  {
    type: 'expense',
    amount: 180_000,
    category: '보험',
    description: '실비보험',
    ageDays: 38,
    by: 2,
  },
  // 변동 지출
  { type: 'expense', amount: 42_000, category: '식비', description: '장보기', ageDays: 2, by: 1 },
  { type: 'expense', amount: 23_500, category: '식비', description: '점심', ageDays: 4, by: 2 },
  {
    type: 'expense',
    amount: 51_000,
    category: '식비',
    description: '주말 외식',
    ageDays: 7,
    by: 1,
  },
  { type: 'expense', amount: 38_000, category: '식비', description: '배달', ageDays: 15, by: 2 },
  { type: 'expense', amount: 47_000, category: '식비', description: '장보기', ageDays: 45, by: 1 },
  {
    type: 'expense',
    amount: 55_000,
    category: '교통',
    description: '교통비 충전',
    ageDays: 3,
    by: 1,
  },
  {
    type: 'expense',
    amount: 60_000,
    category: '교통',
    description: '교통비 충전',
    ageDays: 33,
    by: 2,
  },
  // Flex
  {
    type: 'flex',
    amount: 480_000,
    category: '여행',
    description: '제주 항공권',
    ageDays: 20,
    by: 1,
  },
  { type: 'flex', amount: 89_000, category: '소비', description: '데이트', ageDays: 6, by: 2 },
  { type: 'flex', amount: 120_000, category: '소비', description: '생일 선물', ageDays: 22, by: 1 },
];

export async function seedDemoData(coupleId: string, uid1: string, uid2: string): Promise<void> {
  await seedDefaultCategories(coupleId);

  for (const e of ENTRIES) {
    await seedCashbookEntry(coupleId, e.by === 1 ? uid1 : uid2, {
      type: e.type,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: daysAgo(e.ageDays),
    });
  }

  // 현금흐름 캘린더: 보유 현금 + 급여일 + 다가오는 예측들
  await seedCashflowSettings(coupleId, {
    currentCash: 5_240_000,
    variableMode: 3,
    paydays: [{ id: 'pay-1', label: '급여일', dayOfMonth: 25 }],
  });
  const predictions: Array<{
    type: 'income' | 'expense' | 'flex';
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
    body: '여행 동안 쓴 돈을 Flex로 묶어두니 정산이 깔끔하더라고요. 카드별로 누가 얼마 썼는지도 자동으로 나뉘어요.',
    publishedAt: daysAgo(6),
    author: { uid: uid1, coupleId, displayName: '지수' },
  });
}
