'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, EmptyState, Input } from '@uandi/ui';
import type { AdminUserRow } from '@/services/admin';
import {
  DEFAULT_ADMIN_SORT,
  filterAdminUsers,
  nextAdminSort,
  sortAdminUsers,
  type AdminSort,
  type AdminSortKey,
} from './admin-user-list';

/** 사진이 없을 때 보여줄 이니셜(이름 → 이메일 순). */
function initialOf(u: AdminUserRow): string {
  return (u.displayName || u.email || '?').trim().charAt(0).toUpperCase();
}

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '-';
  return dayjs(iso).format(withTime ? 'YYYY.MM.DD HH:mm' : 'YYYY.MM.DD');
}

const PLATFORM_LABELS: Record<string, string> = { android: 'Android', ios: 'iOS', web: '웹' };

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: AdminSortKey;
  sort: AdminSort;
  onSort: (key: AdminSortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      className={`px-3 py-2 font-medium ${align === 'right' ? 'text-right' : ''}`}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <Button
        variant="ghost"
        size="sm"
        data-testid={`admin-sort-${sortKey}`}
        className={`h-auto gap-1 px-1 py-0.5 text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon size={12} />
      </Button>
    </th>
  );
}

export type AdminUserTableProps = {
  users: AdminUserRow[];
};

/** 사용자별 현황 표. 열 머리글로 정렬하고 이름·이메일로 검색한다. 가계부 내용 없이 건수만 보여준다. */
export function AdminUserTable({ users }: AdminUserTableProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<AdminSort>(DEFAULT_ADMIN_SORT);

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="아직 가입한 사용자가 없어요"
        description="가입자가 생기면 여기에 표시돼요"
      />
    );
  }

  const visible = sortAdminUsers(filterAdminUsers(users, query), sort);
  const onSort = (key: AdminSortKey) => setSort((current) => nextAdminSort(current, key));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름·이메일 검색"
            aria-label="사용자 검색"
            data-testid="admin-user-search"
            className="pl-9"
          />
        </div>
        <p className="shrink-0 text-xs text-muted-foreground" data-testid="admin-user-count">
          {query ? `${visible.length}명 / 전체 ${users.length}명` : `전체 ${users.length}명`}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <SortableHeader label="사용자" sortKey="name" sort={sort} onSort={onSort} />
              <SortableHeader label="가입일" sortKey="createdAt" sort={sort} onSort={onSort} />
              <SortableHeader
                label="최근 활동"
                sortKey="lastActiveAt"
                sort={sort}
                onSort={onSort}
              />
              <th className="px-3 py-2 font-medium">커플</th>
              <SortableHeader
                label="기록 (본인/커플)"
                sortKey="myEntryCount"
                sort={sort}
                onSort={onSort}
                align="right"
              />
              <SortableHeader
                label="마지막 기록"
                sortKey="lastEntryAt"
                sort={sort}
                onSort={onSort}
              />
              <th className="px-3 py-2 font-medium">플랫폼</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  「{query.trim()}」와 일치하는 사용자가 없어요
                </td>
              </tr>
            ) : (
              visible.map((u) => (
                <tr key={u.uid} data-testid="admin-user-row" className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0" data-testid="admin-user-avatar">
                        <AvatarImage src={u.photoURL ?? undefined} alt={u.displayName ?? ''} />
                        <AvatarFallback className="text-xs">{initialOf(u)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">{u.displayName || '이름 없음'}</p>
                        <p data-testid="admin-user-email" className="text-xs text-muted-foreground">
                          {u.email ?? u.uid}
                        </p>
                      </div>
                    </div>
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
                  <td
                    data-testid="admin-user-entries"
                    className="px-3 py-2 text-right tabular-nums"
                  >
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
