import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';

export default function InnerLayout({ children }: { children: ReactNode }) {
  return <AppShell space="inner">{children}</AppShell>;
}
