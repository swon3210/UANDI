'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@uandi/ui';

type CommunityDeleteConfirmDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function CommunityDeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  isPending,
}: CommunityDeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="community-delete-dialog">
        <DialogHeader>
          <DialogTitle>글을 삭제할까요?</DialogTitle>
          <DialogDescription>
            삭제한 글은 되돌릴 수 없어요. 첨부한 이미지도 함께 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? '삭제 중...' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
