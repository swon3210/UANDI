import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { BulkSyncResultView, type BulkSyncEntryData } from './BulkSyncResultView';

const SELECTED_MONTH = '2026-06';

const row = (over: Partial<BulkSyncEntryData>): BulkSyncEntryData => ({
  type: 'expense',
  amount: 12000,
  category: '식비',
  description: '스타벅스',
  date: '2026-06-15',
  confidence: 0.95,
  month: '2026-06',
  isTransfer: false,
  duplicate: null,
  selected: true,
  ...over,
});

const meta: Meta<typeof BulkSyncResultView> = {
  title: 'Cashbook/BulkSyncResultView',
  component: BulkSyncResultView,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open onOpenChange={() => {}}>
        <div className="mx-auto max-w-md">
          <Story />
        </div>
      </Sheet>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BulkSyncResultView>;

const baseProps = {
  selectedMonth: SELECTED_MONTH,
  categories: [],
  coupleId: 'couple-1',
  createdBy: 'user-1',
  onConfirm: () => {},
  onClose: () => {},
};

// 기본: 선택 결산월 누락 내역만
export const Default: Story = {
  render: () => (
    <BulkSyncResultView
      {...baseProps}
      imageCount={2}
      initialEntries={[
        row({ description: '스타벅스', amount: 12000, date: '2026-06-15' }),
        row({ description: '김밥천국', amount: 8000, date: '2026-06-18', category: '식비' }),
        row({ description: '다이소', amount: 9900, date: '2026-06-20', category: '쇼핑' }),
      ]}
    />
  ),
};

// 다월 혼합: 6월(선택)·7월(다른 달, 기본 OFF) 섞임
export const MultiMonth: Story = {
  render: () => (
    <BulkSyncResultView
      {...baseProps}
      imageCount={1}
      initialEntries={[
        row({ description: '6월 마트', amount: 30000, date: '2026-06-10' }),
        row({ description: '6월 카페', amount: 5500, date: '2026-06-22' }),
        row({
          description: '7월 마트',
          amount: 42000,
          date: '2026-07-03',
          month: '2026-07',
          selected: false,
        }),
        row({
          description: '7월 주유',
          amount: 60000,
          date: '2026-07-05',
          month: '2026-07',
          category: '교통',
          selected: false,
        }),
      ]}
    />
  ),
};

// 송금 포함: 단순 송금은 "확인 필요" 그룹, 기본 OFF
export const WithTransfers: Story = {
  render: () => (
    <BulkSyncResultView
      {...baseProps}
      imageCount={1}
      initialEntries={[
        row({ description: '스타벅스', amount: 12000, date: '2026-06-15' }),
        row({
          description: '홍길동 이체',
          amount: 50000,
          date: '2026-06-16',
          category: '기타',
          isTransfer: true,
          selected: false,
        }),
        row({
          description: 'ATM 출금',
          amount: 100000,
          date: '2026-06-17',
          category: '기타',
          isTransfer: true,
          selected: false,
        }),
      ]}
    />
  ),
};

// 전부 중복: 추가할 항목 없음 (확인 버튼 비활성)
export const AllDuplicates: Story = {
  render: () => (
    <BulkSyncResultView
      {...baseProps}
      imageCount={1}
      initialEntries={[
        row({
          description: '스타벅스',
          amount: 12000,
          date: '2026-06-15',
          duplicate: { existingId: 'e1', existingDate: '2026-06-15' },
          selected: false,
        }),
        row({
          description: '김밥천국',
          amount: 8000,
          date: '2026-06-18',
          duplicate: { existingId: 'e2', existingDate: '2026-06-18' },
          selected: false,
        }),
      ]}
    />
  ),
};

// 종합: 다월 + 송금 + 중복 + 낮은 신뢰도
export const Mixed: Story = {
  render: () => (
    <BulkSyncResultView
      {...baseProps}
      imageCount={3}
      initialEntries={[
        row({ description: '스타벅스', amount: 12000, date: '2026-06-15' }),
        row({
          description: '흐릿한 영수증',
          amount: 7700,
          date: '2026-06-19',
          confidence: 0.4,
        }),
        row({
          description: '김밥천국(이미 기록)',
          amount: 8000,
          date: '2026-06-18',
          duplicate: { existingId: 'e2', existingDate: '2026-06-18' },
          selected: false,
        }),
        row({
          description: '7월 마트',
          amount: 42000,
          date: '2026-07-03',
          month: '2026-07',
          selected: false,
        }),
        row({
          description: '토스 송금',
          amount: 30000,
          date: '2026-06-21',
          category: '기타',
          isTransfer: true,
          selected: false,
        }),
      ]}
    />
  ),
};
