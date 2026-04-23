'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Skeleton,
} from '@uandi/ui';

type DescendantCount = { folders: number; photos: number };

type DeleteFolderConfirmSheetProps = {
  folderName: string;
  count: DescendantCount | null;
  isLoading?: boolean;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteFolderConfirmSheet({
  folderName,
  count,
  isLoading,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteFolderConfirmSheetProps) {
  const showCounts = !!count && (count.folders > 0 || count.photos > 0);

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh]"
      data-testid="delete-folder-confirm"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle size={20} />
          폴더 삭제
        </SheetTitle>
        <SheetDescription className="text-left">
          <span className="font-medium text-foreground">‘{folderName}’</span> 폴더를 삭제할까요?
        </SheetDescription>
      </SheetHeader>
      <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : showCounts ? (
          <p>
            이 폴더와 <span className="font-medium text-foreground">하위 폴더 {count!.folders}개</span>
            , <span className="font-medium text-foreground">사진 {count!.photos}장</span>이 모두 삭제됩니다. 되돌릴 수 없어요.
          </p>
        ) : (
          <p>이 폴더를 삭제합니다. 되돌릴 수 없어요.</p>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isDeleting}>
          취소
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={onConfirm}
          disabled={isDeleting || isLoading}
        >
          {isDeleting ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              삭제 중...
            </>
          ) : (
            '삭제'
          )}
        </Button>
      </div>
    </SheetContent>
  );
}
