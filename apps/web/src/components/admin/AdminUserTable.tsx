import dayjs from 'dayjs';
import { Users } from 'lucide-react';
import { Badge, EmptyState } from '@uandi/ui';
import type { AdminUserRow } from '@/services/admin';

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '-';
  return dayjs(iso).format(withTime ? 'YYYY.MM.DD HH:mm' : 'YYYY.MM.DD');
}

const PLATFORM_LABELS: Record<string, string> = { android: 'Android', ios: 'iOS', web: '웹' };

export type AdminUserTableProps = {
  users: AdminUserRow[];
};

/** 사용자별 현황 표(최근 활동 순으로 받은 그대로 표시). 가계부 내용 없이 건수만 보여준다. */
export function AdminUserTable({ users }: AdminUserTableProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="아직 가입한 사용자가 없어요"
        description="가입자가 생기면 여기에 표시돼요"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[880px] text-sm">
        <thead className="bg-muted text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">사용자</th>
            <th className="px-3 py-2 font-medium">가입일</th>
            <th className="px-3 py-2 font-medium">최근 활동</th>
            <th className="px-3 py-2 font-medium">커플</th>
            <th className="px-3 py-2 text-right font-medium">기록 (본인/커플)</th>
            <th className="px-3 py-2 font-medium">마지막 기록</th>
            <th className="px-3 py-2 font-medium">플랫폼</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid} data-testid="admin-user-row" className="border-t border-border">
              <td className="px-3 py-2">
                <p className="font-medium">{u.displayName || '이름 없음'}</p>
                <p data-testid="admin-user-email" className="text-xs text-muted-foreground">
                  {u.email ?? u.uid}
                </p>
              </td>
              <td className="px-3 py-2 tabular-nums">{formatDate(u.createdAt)}</td>
              <td className="px-3 py-2 tabular-nums">{formatDate(u.lastActiveAt, true)}</td>
              <td className="px-3 py-2">
                {u.partnerEmail ? (
                  <span className="text-xs">{u.partnerEmail}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {u.coupleId ? '상대 대기 중' : '미연결'}
                  </span>
                )}
              </td>
              <td data-testid="admin-user-entries" className="px-3 py-2 text-right tabular-nums">
                {u.myEntryCount} / {u.coupleEntryCount}
              </td>
              <td className="px-3 py-2 tabular-nums">{formatDate(u.lastEntryAt)}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {u.platforms.length === 0 ? (
                    <span className="text-xs text-muted-foreground">-</span>
                  ) : (
                    u.platforms.map((p) => (
                      <Badge key={p} variant="secondary">
                        {PLATFORM_LABELS[p] ?? p}
                      </Badge>
                    ))
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
