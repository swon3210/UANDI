'use client';

import { useMemo, useState } from 'react';
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
  const folderMap = useMemo(() => {
    const m = new Map<string, Folder>();
    for (const f of folders) m.set(f.id, f);
    return m;
  }, [folders]);

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
          {availableFolders.map((folder) => {
            const pathNames = (folder.path ?? [])
              .map((id) => folderMap.get(id)?.name)
              .filter(Boolean) as string[];
            const pathHint = pathNames.length > 0 ? pathNames.join(' / ') : null;
            return (
              <Label
                key={folder.id}
                htmlFor={`folder-${folder.id}`}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                data-testid={`move-folder-${folder.id}`}
              >
                <RadioGroupItem value={folder.id} id={`folder-${folder.id}`} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-base">{folder.name}</span>
                  {pathHint && (
                    <span className="truncate text-xs text-muted-foreground">{pathHint}</span>
                  )}
                </div>
              </Label>
            );
          })}
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
