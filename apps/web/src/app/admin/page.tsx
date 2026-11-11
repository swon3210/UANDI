'use client';

import Link from 'next/link';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { ArrowLeft, RefreshCw, ShieldOff } from 'lucide-react';
import { Button, EmptyState, Header } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AdminSummaryCards } from '@/components/admin/AdminSummaryCards';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { AdminForbiddenError } from '@/services/admin';
import { authStatusAtom, userAtom } from '@/stores/auth.store';

/** 운영자용 사용자 현황(docs/pages/06-admin.md). 접근 제어는 서버(ADMIN_EMAILS)가 한다. */
export default function AdminUsersPage() {
  const status = useAtomValue(authStatusAtom);
  const user = useAtomValue(userAtom);
  const signedIn = status === 'authenticated_with_couple' || status === 'authenticated_no_couple';
  const { data, error, isLoading, isFetching, refetch } = useAdminUsers(user?.uid ?? null);

  const header = (
    <Header
      title="사용자 현황"
      leftSlot={
        <Button variant="ghost" size="icon" asChild aria-label="홈으로">
          <Link href="/">
            <ArrowLeft size={20} />
          </Link>
        </Button>
      }
      rightSlot={
        data ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="새로고침"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : undefined} />
          </Button>
        ) : null
      }
    />
  );

  if (status === 'loading' || (signedIn && isLoading)) {
    return <MascotLoader fullScreen />;
  }

  if (!signedIn || error instanceof AdminForbiddenError) {
    return (
      <div className="flex min-h-screen flex-col">
        {header}
        <main data-testid="admin-forbidden">
          <EmptyState
            icon={<ShieldOff />}
            title="접근 권한이 없어요"
            description="허용된 운영자 계정으로 로그인해야 볼 수 있어요"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main data-testid="admin-users-page" className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : data ? (
          <>
            <AdminSummaryCards users={data.users} />
            <AdminUserTable users={data.users} />
            <p className="text-xs text-muted-foreground">
              {dayjs(data.generatedAt).format('YYYY.MM.DD HH:mm')} 기준 · 가계부 내용은 표시하지
              않고 건수만 보여줘요
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
