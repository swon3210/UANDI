import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return <AppShell space="community">{children}</AppShell>;
}
