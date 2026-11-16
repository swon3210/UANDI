'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Users } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Input,
} from '@uandi/ui';
import type { AdminUserRow } from '@/services/admin';
import {
  DEFAULT_ADMIN_SORT,
  filterAdminUsers,
  nextAdminSort,
  selectAdminUsers,
  sortAdminUsers,
  type AdminQuickSelect,
  type AdminSort,
  type AdminSortKey,
} from './admin-user-list';

const QUICK_SELECTS: { preset: AdminQuickSelect; label: string }[] = [
  { preset: 'all', label: '전체' },
  { preset: 'android', label: 'Android' },
  { preset: 'ios', label: 'iOS' },
  { preset: 'solo', label: '짝꿍 없음' },
];

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

export type AdminUserSelection = {
  selectedUids: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
};

export type AdminUserTableProps = {
  users: AdminUserRow[];
  /** 주면 체크박스 열과 빠른 선택이 붙는다(공지 푸시 대상 고르기 — docs/pages/10-announcement-push.md) */
  selection?: AdminUserSelection;
};

/** 사용자별 현황 표. 열 머리글로 정렬하고 이름·이메일로 검색한다. 가계부 내용 없이 건수만 보여준다. */
export function AdminUserTable({ users, selection }: AdminUserTableProps) {
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
  const columnCount = selection ? 8 : 7;

  const selected = selection?.selectedUids;
  const allVisibleSelected =
    !!selected && visible.length > 0 && visible.every((u) => selected.has(u.uid));

  const toggleOne = (uid: string, checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selectedUids);
    if (checked) next.add(uid);
    else next.delete(uid);
    selection.onChange(next);
  };
  // 머리글 체크박스는 지금 보이는(검색된) 행만 고르거나 푼다
  const toggleVisible = (checked: boolean) => {
    if (!selection) return;
    const next = new Set(selection.selectedUids);
    for (const u of visible) {
      if (checked) next.add(u.uid);
      else next.delete(u.uid);
    }
    selection.onChange(next);
  };

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

      {selection ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="admin-quick-select">
          <span className="text-xs text-muted-foreground">빠른 선택</span>
          {QUICK_SELECTS.map(({ preset, label }) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              data-testid={`admin-quick-select-${preset}`}
              onClick={() => selection.onChange(new Set(selectAdminUsers(users, preset)))}
            >
              {label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            data-testid="admin-quick-select-clear"
            onClick={() => selection.onChange(new Set())}
          >
            선택 해제
          </Button>
          <span className="ml-auto text-sm font-medium" data-testid="admin-selected-count">
            {selection.selectedUids.size}명 선택
          </span>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              {selection ? (
                <th className="w-10 px-3 py-2">
                  <Checkbox
                    aria-label="보이는 사용자 모두 선택"
                    data-testid="admin-user-select-all"
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleVisible(checked === true)}
                  />
                </th>
              ) : null}
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
                <td
                  colSpan={columnCount}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  「{query.trim()}」와 일치하는 사용자가 없어요
                </td>
              </tr>
            ) : (
              visible.map((u) => (
                <tr key={u.uid} data-testid="admin-user-row" className="border-t border-border">
                  {selection ? (
                    <td className="px-3 py-2">
                      <Checkbox
                        aria-label={`${u.displayName || u.email || u.uid} 선택`}
                        data-testid="admin-user-select"
                        checked={selection.selectedUids.has(u.uid)}
                        onCheckedChange={(checked) => toggleOne(u.uid, checked === true)}
                      />
                    </td>
                  ) : null}
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
                    <div className="flex flex-wrap gap-1" data-testid="admin-user-platforms">
                      {u.platforms.length === 0 ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : (
                        u.platforms.map((p) => (
                          <Badge
                            key={p.name}
                            variant="secondary"
                            title={
                              p.lastSeenAt
                                ? `마지막 사용 ${formatDate(p.lastSeenAt, true)}`
                                : '푸시 알림 토큰으로 확인'
                            }
                          >
                            {PLATFORM_LABELS[p.name] ?? p.name}
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
