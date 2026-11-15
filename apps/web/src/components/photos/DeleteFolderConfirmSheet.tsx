'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('photos');
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
          {t('folder.delete')}
        </SheetTitle>
        <SheetDescription className="text-left">
          {t.rich('folder.deleteQuestion', {
            name: folderName,
            em: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
          })}
        </SheetDescription>
      </SheetHeader>
      <div className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : showCounts ? (
          <p>
            {t.rich('folder.deleteWithCounts', {
              folders: count!.folders,
              photos: count!.photos,
              b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
            })}
          </p>
        ) : (
          <p>{t('folder.deleteSimple')}</p>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isDeleting}>
          {t('folder.cancel')}
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
              {t('folder.deleting')}
            </>
          ) : (
            t('folder.deleteSubmit')
          )}
        </Button>
      </div>
    </SheetContent>
  );
}
