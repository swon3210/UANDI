'use client';

import { useState } from 'react';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
} from '@uandi/ui';
import type { Folder } from '@/types';

type MovePhotosSheetProps = {
  folders: Folder[];
  currentFolderId: string;
  selectedCount: number;
  onMove: (targetFolderId: string) => void;
};

export function MovePhotosSheet({
  folders,
  currentFolderId,
  selectedCount,
  onMove,
}: MovePhotosSheetProps) {
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>이동할 폴더 선택</SheetTitle>
      </SheetHeader>
      <div className="py-4">
        <RadioGroup
          value={targetFolderId ?? undefined}
          onValueChange={(val) => setTargetFolderId(val)}
        >
          {availableFolders.map((folder) => (
            <Label
              key={folder.id}
              htmlFor={`folder-${folder.id}`}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              data-testid={`move-folder-${folder.id}`}
            >
              <RadioGroupItem value={folder.id} id={`folder-${folder.id}`} />
              <span className="text-base">{folder.name}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
      <div className="px-4 pb-6">
        <Button
          className="w-full"
          disabled={!targetFolderId}
          onClick={() => targetFolderId && onMove(targetFolderId)}
          data-testid="confirm-move-btn"
        >
          이동 ({selectedCount}장)
        </Button>
      </div>
    </SheetContent>
  );
}
