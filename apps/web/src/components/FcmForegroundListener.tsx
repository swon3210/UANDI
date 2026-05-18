'use client';

import { useFcmForegroundMessages } from '@/hooks/useFcmForegroundMessages';

// providers.tsx에서 한 번만 마운트되는 컨테이너.
// FCM onMessage 구독을 컴포넌트 트리에 끼워 넣기 위한 thin wrapper.
export function FcmForegroundListener(): null {
  useFcmForegroundMessages();
  return null;
}
