'use client';

import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Button } from '@uandi/ui';
import { Pencil, Trash2 } from 'lucide-react';

type FolderMenuSheetProps = {
  onRename: () => void;
  onDelete: () => void;
};

export function FolderMenuSheet({ onRename, onDelete }: FolderMenuSheetProps) {
  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>폴더 관리</SheetTitle>
        <SheetDescription className="sr-only">폴더 관리 메뉴</SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={onRename}>
          <Pencil size={20} />
          이름 변경
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 size={20} />
          폴더 삭제
        </Button>
      </div>
    </SheetContent>
  );
}
