import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { IosNativeGuard } from '@/components/shell/IosNativeGuard';

export default function OuterLayout({ children }: { children: ReactNode }) {
  // 재테크는 iOS 네이티브에서 숨김(App Store 심사 대응) → 진입 시 가계부로 리다이렉트.
  return (
    <IosNativeGuard>
      <AppShell space="outer">{children}</AppShell>
    </IosNativeGuard>
  );
}
