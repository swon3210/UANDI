import type { AdminUserRow } from '@/services/admin';

export type AdminSortKey = 'name' | 'createdAt' | 'lastActiveAt' | 'myEntryCount' | 'lastEntryAt';
export type AdminSortDir = 'asc' | 'desc';
export type AdminSort = { key: AdminSortKey; dir: AdminSortDir };

export const DEFAULT_ADMIN_SORT: AdminSort = { key: 'lastActiveAt', dir: 'desc' };

/** 이름·이메일·커플 상대 이메일에서 대소문자 무시 부분 일치. */
export function filterAdminUsers(users: AdminUserRow[], query: string): AdminUserRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((u) =>
    [u.displayName, u.email, u.partnerEmail].some((v) => v?.toLowerCase().includes(q))
  );
}

function sortValue(u: AdminUserRow, key: AdminSortKey): string | number | null {
  switch (key) {
    case 'name':
      return (u.displayName || u.email || '').toLowerCase() || null;
    case 'myEntryCount':
      return u.myEntryCount;
    default:
      return u[key];
  }
}

/** 값이 없는 행(null)은 방향과 관계없이 항상 맨 뒤로 보낸다. */
export function sortAdminUsers(users: AdminUserRow[], sort: AdminSort): AdminUserRow[] {
  const sign = sort.dir === 'asc' ? 1 : -1;
  return [...users].sort((a, b) => {
    const va = sortValue(a, sort.key);
    const vb = sortValue(b, sort.key);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sign;
    return String(va).localeCompare(String(vb), 'ko') * sign;
  });
}

/** 같은 열을 다시 누르면 방향을 뒤집고, 다른 열은 이름만 오름차순·나머지는 내림차순으로 시작한다. */
export function nextAdminSort(current: AdminSort, key: AdminSortKey): AdminSort {
  if (current.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  return { key, dir: key === 'name' ? 'asc' : 'desc' };
}

/** 공지 푸시 대상 빠른 선택(docs/pages/10-announcement-push.md). */
export type AdminQuickSelect = 'all' | 'android' | 'ios' | 'solo';

/** 빠른 선택 조건에 맞는 사용자 uid. 선택을 이 결과로 바꾼다(누적 아님). */
export function selectAdminUsers(users: AdminUserRow[], preset: AdminQuickSelect): string[] {
  const match = (u: AdminUserRow) => {
    switch (preset) {
      case 'all':
        return true;
      case 'android':
      case 'ios':
        return u.platforms.some((p) => p.name === preset);
      case 'solo':
        // 커플 미연결 또는 상대 대기 중
        return !u.partnerEmail;
    }
  };
  return users.filter(match).map((u) => u.uid);
}
