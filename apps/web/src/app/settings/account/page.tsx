'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import { AccountInfoCard, Button, Header } from '@uandi/ui';
import type { User } from '@/types';
import { BackButton } from '@/components/shell/BackButton';
import { AccountDeleteConfirmDialog } from '@/components/settings/AccountDeleteConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { getSignInProvider, signOut } from '@/lib/firebase/auth';

const PARENT = '/settings';

/**
 * 계정 관리 — 로그인 이메일·수단 확인, 로그아웃, 회원탈퇴(docs/04-auth-flow.md 「계정 관리 페이지」).
 * 프로필 편집(이름·사진 저장 폼)과 분리해, 되돌릴 수 없는 계정 동작을 한곳에 모은다.
 */
export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  // 설정 페이지들은 AppShell 가드 밖이라 비로그인 전환 시 자동 리다이렉트가 없다.
  // 탈퇴(useDeleteAccount)와 같이 로그아웃 뒤 랜딩으로 직접 보낸다.
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error('로그아웃에 실패했어요. 다시 시도해주세요.');
      return;
    }
    router.replace('/');
  };

  return (
    <div className="flex min-h-screen flex-col" data-testid="account-page">
      <Header
        data-testid="account-header"
        title="계정"
        leftSlot={<BackButton fallbackHref={PARENT} />}
      />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
        <AccountInfoCard email={user.email} provider={getSignInProvider()} />

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={handleSignOut}
          data-testid="sign-out-button"
        >
          <LogOut size={18} className="mr-2" />
          로그아웃
        </Button>

        <DeleteAccountSection user={user} />
      </main>
    </div>
  );
}

/** 회원탈퇴 — 페이지 맨 아래, 눈에 띄지 않는 텍스트 버튼. 확인 다이얼로그를 거쳐 실행한다. */
function DeleteAccountSection({ user }: { user: User }) {
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteAccount = async () => {
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <AccountDeleteConfirmDialog
        isOpen={isOpen}
        isPending={deleteAccountMutation.isPending}
        onConfirm={() => {
          close(true);
          setTimeout(unmount, 300);
        }}
        onCancel={() => {
          close(false);
          setTimeout(unmount, 300);
        }}
      />
    ));
    if (confirmed) {
      deleteAccountMutation.mutate({ uid: user.uid, coupleId: user.coupleId });
    }
  };

  return (
    <div className="mt-auto flex justify-center border-t border-border pt-6">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
        onClick={handleDeleteAccount}
        data-testid="delete-account-button"
      >
        회원탈퇴
      </Button>
    </div>
  );
}
