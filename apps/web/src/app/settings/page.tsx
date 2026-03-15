'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { overlay } from 'overlay-kit';
import {
  Header,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { AccountDeleteConfirmDialog } from '@/components/settings/AccountDeleteConfirmDialog';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const deleteAccountMutation = useDeleteAccount();

  if (!user) return null;

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
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="settings-header"
        title="설정"
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로가기">
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <main className="max-w-md mx-auto w-full px-4 pt-6 space-y-6">
        {/* 프로필 섹션 */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16" data-testid="settings-profile-avatar">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName} />
            ) : null}
            <AvatarFallback>
              <UserIcon size={24} />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-lg font-semibold" data-testid="settings-profile-name">
              {user.displayName}
            </span>
            <span className="text-sm text-muted-foreground" data-testid="settings-profile-email">
              {user.email}
            </span>
          </div>
        </div>

        <Separator />

        {/* 회원탈퇴 */}
        <div>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteAccount}
            data-testid="delete-account-button"
          >
            회원탈퇴
          </Button>
        </div>
      </main>
    </div>
  );
}
