import type { CategoryGroup, CategorySubGroup } from '../types';
import { CATEGORY_COLOR_PALETTE } from './category-colors';

export type DefaultCategory = {
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  description: string;
  examples: string[];
};

export const SUB_GROUP_LABELS: Record<CategorySubGroup, string> = {
  regular_income: '정기 수입',
  irregular_income: '비정기 수입',
  fixed_expense: '고정 지출',
  variable_common: '변동 지출 (공통)',
  variable_personal: '변동 지출 (각자)',
};

/**
 * 자식 카테고리 chip·잠긴 부모 표시 등에 노출되는 짧은 축 라벨.
 * "공동/각자", "정기/비정기·고정/변동" 축을 자식 단계에서도 시각적으로 보존하기 위함.
 */
export const SUB_GROUP_SHORT_LABELS: Record<CategorySubGroup, string> = {
  regular_income: '정기',
  irregular_income: '비정기',
  fixed_expense: '고정',
  variable_common: '공통',
  variable_personal: '각자',
};

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  income: '수입',
  expense: '지출',
};

export const SUB_GROUPS_BY_GROUP: Record<CategoryGroup, CategorySubGroup[]> = {
  income: ['regular_income', 'irregular_income'],
  expense: ['fixed_expense', 'variable_common', 'variable_personal'],
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // ── 수입: 정기 ──
  { group: 'income', subGroup: 'regular_income', name: '정기급여', icon: 'wallet', color: '#4CAF86', sortOrder: 0, description: '매달 고정으로 들어오는 급여', examples: ['월급'] },
  { group: 'income', subGroup: 'regular_income', name: '상여', icon: 'gift', color: '#E5B53E', sortOrder: 1, description: '분기·반기·연말 상여금, 명절 상여', examples: ['분기 상여', '명절 상여', '연말 상여'] },
  // ── 수입: 비정기 ──
  { group: 'income', subGroup: 'irregular_income', name: '인센티브', icon: 'trophy', color: '#5B8DEF', sortOrder: 0, description: '성과 기반 인센티브, 연차보상', examples: ['성과급', '연차보상'] },
  { group: 'income', subGroup: 'irregular_income', name: '부업', icon: 'briefcase', color: '#9B7ED8', sortOrder: 1, description: '본업 외 프리랜서·외주·강의 수입', examples: ['외주', '강의', '프리랜서'] },
  { group: 'income', subGroup: 'irregular_income', name: '중고거래', icon: 'arrows_clockwise', color: '#2E9C8F', sortOrder: 2, description: '중고 물품 판매 수익', examples: ['당근', '번개장터'] },

  // ── 지출: 고정 ──
  { group: 'expense', subGroup: 'fixed_expense', name: '월세', icon: 'house', color: '#6A6FD8', sortOrder: 0, description: '월세, 전세 이자 등 주거 고정비', examples: ['월세', '전세이자'] },
  { group: 'expense', subGroup: 'fixed_expense', name: '금융비용', icon: 'bank', color: '#78909C', sortOrder: 1, description: '대출 이자, 카드 연회비 등', examples: ['대출이자', '신용이자', '카드 연회비'] },
  { group: 'expense', subGroup: 'fixed_expense', name: '보험', icon: 'shield_check', color: '#2E9C8F', sortOrder: 2, description: '실손·자동차·생명보험 등 정기 납부 보험료', examples: ['실손보험', '자동차보험', '생명보험'] },
  { group: 'expense', subGroup: 'fixed_expense', name: '공과금', icon: 'lightbulb', color: '#E5B53E', sortOrder: 3, description: '전기·수도·가스·인터넷 등 주거 관리비', examples: ['전기', '수도', '가스', '인터넷', '관리비'] },
  { group: 'expense', subGroup: 'fixed_expense', name: '명절 용돈', icon: 'envelope', color: '#E87CA0', sortOrder: 4, description: '명절·경조사 정기 지출', examples: ['설 용돈', '추석 용돈', '경조사'] },
  // ── 지출: 변동 공통 ──
  { group: 'expense', subGroup: 'variable_common', name: '식비', icon: 'bowl_food', color: '#D8635A', sortOrder: 0, description: '부부가 함께한 장보기·외식·배달', examples: ['장보기', '외식', '배달', '마트', '코스트코'] },
  { group: 'expense', subGroup: 'variable_common', name: '소모품', icon: 'broom', color: '#B98565', sortOrder: 1, description: '생활용품·소모품', examples: ['휴지', '세제', '생필품'] },
  { group: 'expense', subGroup: 'variable_common', name: '패션', icon: 'tshirt', color: '#9B7ED8', sortOrder: 2, description: '의류·신발·액세서리 (공동 구매)', examples: ['옷', '신발', '액세서리'] },
  { group: 'expense', subGroup: 'variable_common', name: '데이트', icon: 'heart', color: '#E87CA0', sortOrder: 3, description: '부부가 함께한 식사·카페·문화생활', examples: ['카페', '디저트', '영화'] },
  { group: 'expense', subGroup: 'variable_common', name: '건강', icon: 'barbell', color: '#8BC34A', sortOrder: 4, description: '헬스장·운동용품·건강식품 (공동)', examples: ['헬스장', '영양제'] },
  { group: 'expense', subGroup: 'variable_common', name: '여행', icon: 'airplane', color: '#5BBDD8', sortOrder: 5, description: '여행 경비 (숙박·교통·티켓)', examples: ['숙박', '항공권', '입장권'] },
  { group: 'expense', subGroup: 'variable_common', name: '여가', icon: 'film_slate', color: '#F0A05E', sortOrder: 6, description: '영화·공연·전시 등 부부 문화생활', examples: ['공연', '전시'] },
  // ── 지출: 변동 각자 ──
  { group: 'expense', subGroup: 'variable_personal', name: '식비', icon: 'fork_knife', color: '#D8635A', sortOrder: 0, description: '개인 점심·간식·혼밥', examples: ['점심', '간식', '편의점'] },
  { group: 'expense', subGroup: 'variable_personal', name: '사회생활', icon: 'handshake', color: '#5B8DEF', sortOrder: 1, description: '회식, 직장 동료 모임', examples: ['회식', '직장 모임'] },
  { group: 'expense', subGroup: 'variable_personal', name: '친구', icon: 'confetti', color: '#E5B53E', sortOrder: 2, description: '친구 약속·경조사', examples: ['친구 약속', '경조사'] },
  { group: 'expense', subGroup: 'variable_personal', name: '병원', icon: 'first_aid', color: '#2E9C8F', sortOrder: 3, description: '개인 병원비·약값', examples: ['병원', '약국'] },
  { group: 'expense', subGroup: 'variable_personal', name: '교통', icon: 'bus', color: '#6A6FD8', sortOrder: 4, description: '출퇴근 교통비, 택시', examples: ['지하철', '버스', '택시', '주유'] },
  { group: 'expense', subGroup: 'variable_personal', name: '가족', icon: 'users_three', color: '#C77DD1', sortOrder: 5, description: '친정·시댁 용돈·선물', examples: ['부모님 용돈', '가족 선물'] },
  { group: 'expense', subGroup: 'variable_personal', name: '자기계발', icon: 'book_open', color: '#4CAF86', sortOrder: 6, description: '도서·인강·자격증', examples: ['책', '인강', '자격증'] },
  { group: 'expense', subGroup: 'variable_personal', name: '소비', icon: 'shopping_bag', color: '#E8837A', sortOrder: 7, description: '개인 자유 소비', examples: ['쇼핑', '취미용품'] },
  { group: 'expense', subGroup: 'variable_personal', name: '여가', icon: 'game_controller', color: '#F0A05E', sortOrder: 8, description: '개인 취미·게임·구독', examples: ['게임', '취미', '구독'] },
];

/**
 * ColorPicker 선택지. 카테고리 색의 단일 기준인 `CATEGORY_COLOR_PALETTE`와 같다.
 * 기본 카테고리 색도 이 팔레트에서 고르며, 같은 탭(고정/변동)에 함께 보이는 카테고리끼리는
 * 색이 겹치지 않게 배정했다.
 */
export const COLOR_PRESETS: readonly string[] = CATEGORY_COLOR_PALETTE;
