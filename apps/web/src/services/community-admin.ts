import { getAuth } from '@/lib/firebase/config';
import type { CommunityPost } from '@/types';

export type ModerateAction = 'approve' | 'reject' | 'hide' | 'keep';

// API route는 Timestamp를 ISO 문자열로 직렬화한다. UI 표시용으로 string을 그대로 둔다.
export type AdminCommunityPost = Omit<CommunityPost, 'createdAt' | 'publishedAt'> & {
  createdAt: string | null;
  publishedAt: string | null;
};

export type ModerationLists = {
  pending: AdminCommunityPost[];
  reported: AdminCommunityPost[];
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = getAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchModerationLists(): Promise<ModerationLists> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/admin/posts', { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '' }));
    throw new Error(err.error || '모더레이션 목록을 불러오지 못했어요');
  }
  return (await res.json()) as ModerationLists;
}

export async function moderateCommunityPost(input: {
  postId: string;
  action: ModerateAction;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/community/moderate', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '' }));
    throw new Error(err.error || '처리하지 못했어요');
  }
}
