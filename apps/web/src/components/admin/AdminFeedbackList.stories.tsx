import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { AdminFeedbackFilter } from '@/services/admin-feedback';
import { AdminFeedbackList } from './AdminFeedbackList';
import { SAMPLE_ADMIN_FEEDBACK } from './admin-feedback-fixtures';

const meta: Meta<typeof AdminFeedbackList> = {
  title: 'Admin/AdminFeedbackList',
  component: AdminFeedbackList,
  decorators: [
    (Story) => (
      <div className="max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminFeedbackList>;

function Harness({ hasMore = false, empty = false }: { hasMore?: boolean; empty?: boolean }) {
  const [filter, setFilter] = useState<AdminFeedbackFilter>({ type: 'all', status: 'all' });
  const [items, setItems] = useState(empty ? [] : SAMPLE_ADMIN_FEEDBACK);
  const visible = items.filter(
    (i) =>
      (filter.type === 'all' || i.type === filter.type) &&
      (filter.status === 'all' || i.status === filter.status)
  );
  return (
    <AdminFeedbackList
      items={visible}
      filter={filter}
      onFilterChange={setFilter}
      onStatusChange={(id, status) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
      }
      hasMore={hasMore}
      onLoadMore={() => {}}
    />
  );
}

/** 유형·상태가 섞인 목록. 필터와 상태 변경이 동작한다. */
export const 기본: Story = { render: () => <Harness /> };

/** 다음 페이지가 있을 때 「더 보기」 */
export const 더_보기: Story = { render: () => <Harness hasMore /> };

/** 피드백이 없을 때 */
export const 비어_있음: Story = { render: () => <Harness empty /> };
