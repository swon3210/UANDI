import { getAuthHeaders } from '@/services/community-admin';

/** /api/admin/users 응답의 사용자 한 명. 시각은 ISO 문자열. 가계부 내용은 담지 않는다(건수만). */
export type AdminUserRow = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
  coupleId: string | null;
  partnerEmail: string | null;
  myEntryCount: number;
  coupleEntryCount: number;
  lastEntryAt: string | null;
  platforms: string[];
};

export type AdminUsersResponse = {
  users: AdminUserRow[];
  generatedAt: string;
};

export class AdminForbiddenError extends Error {
  constructor() {
    super('FORBIDDEN');
  }
}

export async function fetchAdminUsers(): Promise<AdminUsersResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/admin/users', { headers });
  if (res.status === 403) throw new AdminForbiddenError();
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '' }));
    throw new Error(err.error || '사용자 현황을 불러오지 못했어요');
  }
  return (await res.json()) as AdminUsersResponse;
}
