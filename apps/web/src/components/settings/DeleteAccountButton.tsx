'use client';

import { overlay } from 'overlay-kit';
import { Button } from '@uandi/ui';
import { AccountDeleteConfirmDialog } from '@/components/settings/AccountDeleteConfirmDialog';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';

type DeleteAccountButtonProps = {
  'data-testid'?: string;
  className?: string;
};

/**
 * 회원탈퇴 텍스트 버튼 + 확인 다이얼로그 + 실행. 계정 관리 페이지와 온보딩(커플 연결 전)에서 같이 쓴다.
 * 눈에 띄지 않는 회색 ghost 버튼으로 두고, 확인 다이얼로그를 거쳐야 실행된다.
 */
export function DeleteAccountButton({
  'data-testid': testId = 'delete-account-button',
  className,
}: DeleteAccountButtonProps) {
  const deleteAccountMutation = useDeleteAccount();

  const handleClick = async () => {
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
    if (confirmed) deleteAccountMutation.mutate();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={['text-muted-foreground hover:text-destructive', className]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      disabled={deleteAccountMutation.isPending}
      data-testid={testId}
    >
      {deleteAccountMutation.isPending ? '처리 중...' : '회원탈퇴'}
    </Button>
  );
}
