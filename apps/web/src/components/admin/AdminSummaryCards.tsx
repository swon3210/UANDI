import dayjs from 'dayjs';
import type { AdminUserRow } from '@/services/admin';

type Summary = { label: string; value: number; testId: string };

function summarize(users: AdminUserRow[], now: dayjs.Dayjs): Summary[] {
  const weekAgo = now.subtract(7, 'day');
  return [
    { label: '전체 가입자', value: users.length, testId: 'admin-summary-total' },
    {
      label: '커플 연결',
      value: users.filter((u) => u.coupleId && u.partnerEmail).length,
      testId: 'admin-summary-coupled',
    },
    {
      label: '기록 1건 이상',
      value: users.filter((u) => u.myEntryCount > 0).length,
      testId: 'admin-summary-recording',
    },
    {
      label: '최근 7일 활동',
      value: users.filter((u) => u.lastActiveAt && dayjs(u.lastActiveAt).isAfter(weekAgo)).length,
      testId: 'admin-summary-active',
    },
  ];
}

export type AdminSummaryCardsProps = {
  users: AdminUserRow[];
  /** 기준 시각(스토리·테스트 고정용). 기본은 지금. */
  now?: string;
};

export function AdminSummaryCards({ users, now }: AdminSummaryCardsProps) {
  const items = summarize(users, now ? dayjs(now) : dayjs());
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.testId}
          data-testid={item.testId}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
