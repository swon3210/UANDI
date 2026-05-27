import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';

export default function OuterLayout({ children }: { children: ReactNode }) {
  return <AppShell space="outer">{children}</AppShell>;
}
