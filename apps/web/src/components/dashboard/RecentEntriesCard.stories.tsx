import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import type { CashbookCategory, CashbookEntry } from '@/types';
import { RecentEntriesCard } from './RecentEntriesCard';

const day = (iso: string) => Timestamp.fromDate(new Date(iso));

function makeEntry(overrides: Partial<CashbookEntry> & { id: string }): CashbookEntry {
  return {
    coupleId: 'c1',
    createdBy: 'u1',
    type: 'expense',
    amount: 9000,
    category: '식비',
    description: '',
    date: day('2026-11-01T12:00:00'),
    createdAt: day('2026-11-01T12:00:00'),
    ...overrides,
  };
}

const categories: CashbookCategory[] = [
  {
    id: 'cat-food',
    coupleId: 'c1',
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'bowl_food',
    color: '#D8635A',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '',
    examples: [],
    createdAt: day('2026-01-01T00:00:00'),
  },
  {
    id: 'cat-salary',
    coupleId: 'c1',
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    color: '#4CAF86',
    isDefault: true,
    sortOrder: 0,
    parentCategoryId: null,
    description: '',
    examples: [],
    createdAt: day('2026-01-01T00:00:00'),
  },
];

/** 작성자 아바타용 — 커플 두 사람(프로필 사진 없음 → 이니셜 폴백) */
const authors = new Map([
  ['u1', { displayName: '진성', photoURL: null }],
  ['u2', { displayName: '세진', photoURL: null }],
]);

const meta: Meta<typeof RecentEntriesCard> = {
  title: 'Dashboard/RecentEntriesCard',
  component: RecentEntriesCard,
  parameters: { layout: 'padded' },
  args: {
    categories,
    historyHref: '/inner/cashbook/history',
    authors,
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RecentEntriesCard>;

/** 첫 주: 내역 1건만 있을 때 */
export const SingleEntry: Story = {
  args: {
    entries: [makeEntry({ id: 'e1', description: '김치찌개' })],
  },
};

/** 4건 이상이면 최근 3건만, 날짜 내림차순 */
export const ThreeOfMany: Story = {
  args: {
    entries: [
      makeEntry({ id: 'e4', description: '책', amount: 20000, date: day('2026-10-29T10:00:00') }),
      makeEntry({ id: 'e1', description: '김치찌개', date: day('2026-11-01T12:00:00') }),
      makeEntry({
        id: 'e3',
        createdBy: 'u2',
        type: 'income',
        category: '정기급여',
        description: '11월 월급',
        amount: 3000000,
        date: day('2026-10-30T09:00:00'),
      }),
      makeEntry({ id: 'e2', description: '버스', amount: 3000, date: day('2026-10-31T08:00:00') }),
    ],
  },
};

/** 긴 메모는 한 줄로 잘린다 */
export const LongDescription: Story = {
  args: {
    entries: [
      makeEntry({
        id: 'e1',
        description: '결혼기념일 저녁 — 예약해 둔 레스토랑에서 코스 요리, 와인 한 병, 디저트까지',
        amount: 186000,
      }),
    ],
  },
};

/** 작성자 정보가 아직 없으면(멤버 로딩 전) 아바타 없이 그린다 */
export const WithoutAuthors: Story = {
  name: '작성자 정보 없음',
  args: {
    authors: undefined,
    entries: [makeEntry({ id: 'e1', description: '김치찌개' })],
  },
};

/** 내역이 없으면 아무것도 그리지 않는다 */
export const Empty: Story = {
  args: { entries: [] },
};
