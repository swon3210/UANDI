'use client';

import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@uandi/ui';
import type { AdminUserRow } from '@/services/admin';
import {
  filterAdminUsers,
  selectAdminUsers,
  sortAdminUsers,
  type AdminQuickSelect,
} from './admin-user-list';

const QUICK_SELECTS: { preset: AdminQuickSelect; label: string }[] = [
  { preset: 'all', label: '전체' },
  { preset: 'android', label: 'Android' },
  { preset: 'ios', label: 'iOS' },
  { preset: 'solo', label: '짝꿍 없음' },
];

const PLATFORM_LABELS: Record<string, string> = { android: 'Android', ios: 'iOS', web: '웹' };

function initialOf(u: AdminUserRow): string {
  return (u.displayName || u.email || '?').trim().charAt(0).toUpperCase();
}

function coupleLabel(u: AdminUserRow): string {
  if (u.partnerEmail) return `짝꿍 ${u.partnerEmail}`;
  return u.coupleId ? '상대 대기 중' : '미연결';
}

export type AdminUserPickerDialogProps = {
  isOpen: boolean;
  users: AdminUserRow[];
  /** 열 때 체크돼 있을 대상(지금 고른 대상) */
  initialSelectedUids: ReadonlySet<string>;
  /** 「n명 선택」 — 고른 대상을 반영한다 */
  onConfirm: (uids: Set<string>) => void;
  /** 취소·바깥 탭 — 다이얼로그 안에서 고른 것은 버린다 */
  onCancel: () => void;
};

/**
 * 공지 푸시 대상 고르기(docs/pages/10-announcement-push.md).
 * 검색·빠른 선택·체크박스로 고르고, 「n명 선택」을 눌러야 반영된다(그 전까지는 임시 선택).
 */
export function AdminUserPickerDialog({
  isOpen,
  users,
  initialSelectedUids,
  onConfirm,
  onCancel,
}: AdminUserPickerDialogProps) {
  const idPrefix = useId();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelectedUids));

  const visible = sortAdminUsers(filterAdminUsers(users, query), { key: 'name', dir: 'asc' });
  const allVisibleSelected = visible.length > 0 && visible.every((u) => selected.has(u.uid));

  const toggle = (uid: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(uid);
      else next.delete(uid);
      return next;
    });
  };
  const toggleVisible = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const u of visible) {
        if (checked) next.add(u.uid);
        else next.delete(u.uid);
      }
      return next;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col"
        data-testid="admin-user-picker"
      >
        <DialogHeader>
          <DialogTitle>공지 푸시 대상 고르기</DialogTitle>
          <DialogDescription>
            검색하거나 빠른 선택으로 고른 뒤 「선택」을 눌러 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름·이메일 검색"
              aria-label="대상 검색"
              data-testid="admin-picker-search"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">빠른 선택</span>
            {QUICK_SELECTS.map(({ preset, label }) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                data-testid={`admin-quick-select-${preset}`}
                onClick={() => setSelected(new Set(selectAdminUsers(users, preset)))}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              data-testid="admin-quick-select-clear"
              onClick={() => setSelected(new Set())}
            >
              선택 해제
            </Button>
          </div>

          <label className="flex items-center gap-2 text-sm" htmlFor={`${idPrefix}-visible`}>
            <Checkbox
              id={`${idPrefix}-visible`}
              data-testid="admin-picker-select-visible"
              checked={allVisibleSelected}
              disabled={visible.length === 0}
              onCheckedChange={(checked) => toggleVisible(checked === true)}
            />
            보이는 {visible.length}명 모두 선택
          </label>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto rounded-xl border border-border sm:max-h-[60vh]">
          {visible.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              「{query.trim()}」와 일치하는 사용자가 없어요
            </li>
          ) : (
            visible.map((u) => {
              const checkboxId = `${idPrefix}-${u.uid}`;
              return (
                <li key={u.uid} data-testid="admin-picker-row">
                  <label
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-accent"
                  >
                    <Checkbox
                      id={checkboxId}
                      data-testid="admin-picker-check"
                      checked={selected.has(u.uid)}
                      onCheckedChange={(checked) => toggle(u.uid, checked === true)}
                    />
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={u.photoURL ?? undefined} alt={u.displayName ?? ''} />
                      <AvatarFallback className="text-xs">{initialOf(u)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.displayName || '이름 없음'}</p>
                      <p
                        className="truncate text-xs text-muted-foreground"
                        data-testid="admin-picker-email"
                      >
                        {u.email ?? u.uid}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{coupleLabel(u)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      {u.platforms.map((p) => (
                        <Badge key={p.name} variant="secondary">
                          {PLATFORM_LABELS[p.name] ?? p.name}
                        </Badge>
                      ))}
                    </div>
                  </label>
                </li>
              );
            })
          )}
        </ul>

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <span className="text-sm font-medium" data-testid="admin-selected-count">
            {selected.size}명 선택됨
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button data-testid="admin-picker-confirm" onClick={() => onConfirm(selected)}>
              {selected.size > 0 ? `${selected.size}명 선택` : '선택 안 함'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
