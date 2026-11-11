'use client';

import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { LogIn, LogOut, RefreshCw, ShieldOff } from 'lucide-react';
import { Button, EmptyState, Header } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AdminSummaryCards } from '@/components/admin/AdminSummaryCards';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { AdminForbiddenError } from '@/services/admin';
import { authStatusAtom, userAtom } from '@/stores/auth.store';

async function handleSignIn() {
  try {
    await signInWithGoogle();
  } catch {
    toast.error('로그인하지 못했어요. 다시 시도해 주세요.');
  }
}

/**
 * 운영자용 사용자 현황(docs/pages/06-admin.md). 어드민 전용 도메인에서는 / 로 열린다.
 * 접근 제어는 서버(ADMIN_EMAILS)가 하고, 이 화면은 로그인·권한 없음 안내만 맡는다.
 */
export default function AdminUsersPage() {
  const status = useAtomValue(authStatusAtom);
  const user = useAtomValue(userAtom);
  const signedIn = status === 'authenticated_with_couple' || status === 'authenticated_no_couple';
  const { data, error, isLoading, isFetching, refetch } = useAdminUsers(user?.uid ?? null);

  const header = (
    <Header
      title="말랑 가계부 어드민"
      rightSlot={
        signedIn ? (
          <div className="flex items-center gap-1">
            {data ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="새로고침"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw size={18} className={isFetching ? 'animate-spin' : undefined} />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              aria-label="로그아웃"
              data-testid="admin-logout"
              onClick={() => void signOut()}
            >
              <LogOut size={18} />
            </Button>
          </div>
        ) : null
      }
    />
  );

  if (status === 'loading' || (signedIn && isLoading)) {
    return <MascotLoader fullScreen />;
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-screen flex-col">
        {header}
        <main data-testid="admin-sign-in">
          <EmptyState
            icon={<LogIn />}
            title="운영자 로그인"
            description="허용된 운영자 Google 계정으로 로그인해 주세요"
            action={<Button onClick={() => void handleSignIn()}>Google로 로그인</Button>}
          />
        </main>
      </div>
    );
  }

  if (error instanceof AdminForbiddenError) {
    return (
      <div className="flex min-h-screen flex-col">
        {header}
        <main data-testid="admin-forbidden">
          <EmptyState
            icon={<ShieldOff />}
            title="접근 권한이 없어요"
            description={`${user?.email ?? '이 계정'}은 운영자 계정이 아니에요`}
            action={
              <Button variant="outline" onClick={() => void signOut()}>
                다른 계정으로 로그인
              </Button>
            }
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
