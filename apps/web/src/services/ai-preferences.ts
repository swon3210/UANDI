import { getAuth } from '@/lib/firebase/config';
import type { AiPreferences } from '@uandi/ui';

// /api/ai/preferences (GET/PUT) 클라이언트. 서버가 토큰에서 coupleId 를 도출하므로 요청 바디에
// coupleId 는 넣지 않는다(서비스 간 auth 헤더 패턴은 services/ai.ts 와 동일).

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

export async function fetchAiPreferences(): Promise<AiPreferences> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/preferences', { headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? 'AI 설정을 불러오지 못했습니다');
  }
  const { preferences } = (await res.json()) as { preferences: AiPreferences };
  return preferences;
}

export async function saveAiPreferences(preferences: AiPreferences): Promise<AiPreferences> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/preferences', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ preferences }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? 'AI 설정 저장에 실패했습니다');
  }
  const { preferences: saved } = (await res.json()) as { preferences: AiPreferences };
  return saved;
}
