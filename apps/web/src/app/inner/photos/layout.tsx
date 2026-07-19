import type { ReactNode } from 'react';
import { IosNativeGuard } from '@/components/shell/IosNativeGuard';

// 갤러리(사진첩)는 iOS 네이티브에서 숨김(App Store 심사 대응) → 진입 시 가계부로 리다이렉트.
// AppShell(space="inner")은 상위 /inner/layout.tsx 가 이미 제공하므로 여기선 가드만 감싼다.
export default function PhotosLayout({ children }: { children: ReactNode }) {
  return <IosNativeGuard>{children}</IosNativeGuard>;
}
