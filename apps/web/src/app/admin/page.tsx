'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { LogIn, LogOut, RefreshCw, ShieldOff } from 'lucide-react';
import { Button, EmptyState, Header, Tabs, TabsContent, TabsList, TabsTrigger } from '@uandi/ui';
import { MascotLoader } from '@/components/MascotLoader';
import { AdminAnnouncementPushSection } from '@/components/admin/AdminAnnouncementPushSection';
import { AdminFeedbackPanel } from '@/components/admin/AdminFeedbackPanel';
import { AdminSummaryCards } from '@/components/admin/AdminSummaryCards';
import { AdminUserTable } from '@/components/admin/AdminUserTable';
import { useAdminFeedback } from '@/hooks/useAdminFeedback';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { AdminForbiddenError } from '@/services/admin';
import type { AdminFeedbackFilter } from '@/services/admin-feedback';
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
  const [feedbackFilter, setFeedbackFilter] = useState<AdminFeedbackFilter>({
    type: 'all',
    status: 'all',
  });
  const feedback = useAdminFeedback(data ? (user?.uid ?? null) : null, feedbackFilter);
  const newFeedbackCount = feedback.data?.pages[0]?.newCount ?? 0;

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
                onClick={() => {
                  void refetch();
                  void feedback.refetch();
                }}
                disabled={isFetching || feedback.isFetching}
              >
                <RefreshCw
                  size={18}
                  className={isFetching || feedback.isFetching ? 'animate-spin' : undefined}
                />
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
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users" data-testid="admin-tab-users">
                사용자
              </TabsTrigger>
              <TabsTrigger value="feedback" data-testid="admin-tab-feedback">
                피드백{newFeedbackCount > 0 ? ` (신규 ${newFeedbackCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="push" data-testid="admin-tab-push">
                공지 푸시
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-4">
              <AdminSummaryCards users={data.users} />
              <AdminUserTable users={data.users} />
              <p className="text-xs text-muted-foreground">
                {dayjs(data.generatedAt).format('YYYY.MM.DD HH:mm')} 기준 · 가계부 내용은 표시하지
                않고 건수만 보여줘요
              </p>
            </TabsContent>
            <TabsContent value="feedback">
              <AdminFeedbackPanel
                query={feedback}
                filter={feedbackFilter}
                onFilterChange={setFeedbackFilter}
              />
            </TabsContent>
            <TabsContent value="push">
              <AdminAnnouncementPushSection users={data.users} />
            </TabsContent>
          </Tabs>
        ) : null}
      </main>
    </div>
  );
}
