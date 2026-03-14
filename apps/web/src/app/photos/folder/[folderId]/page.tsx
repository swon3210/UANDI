'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, CheckSquare } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import { Header, EmptyState, Button, Sheet, Skeleton } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useFolder, useRenameFolder, useDeleteFolder, useFolders } from '@/hooks/useFolders';
import { usePhotosByFolder, useMovePhotos } from '@/hooks/usePhotos';
import { useUploaderAvatars } from '@/hooks/useCoupleMembers';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { FolderMenuSheet } from '@/components/photos/FolderMenuSheet';
import { RenameFolderSheet } from '@/components/photos/RenameFolderSheet';
import { UploaderFilterChips, type UploaderFilter } from '@/components/photos/UploaderFilterChips';
import { SelectionModeBar } from '@/components/photos/SelectionModeBar';
import { MovePhotosSheet } from '@/components/photos/MovePhotosSheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function FolderDetailPage() {
  const params = useParams<{ folderId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;
  const folderId = params.folderId;

  const { data: folder, isLoading: folderLoading } = useFolder(coupleId, folderId);
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePhotosByFolder(coupleId, folderId);
  const { data: allFolders } = useFolders(coupleId);
  const renameMutation = useRenameFolder(coupleId);
  const deleteMutation = useDeleteFolder(coupleId);
  const moveMutation = useMovePhotos(coupleId);
  const uploaderAvatars = useUploaderAvatars(coupleId);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 업로더 필터
  const [uploaderFilter, setUploaderFilter] = useState<UploaderFilter>('all');

  // 선택 모드
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredPhotos = useMemo(() => {
    const allPhotos = data?.pages.flatMap((p) => p.photos) ?? [];
    if (uploaderFilter === 'all') return allPhotos;
    if (uploaderFilter === 'me') return allPhotos.filter((p) => p.uploadedBy === user?.uid);
    return allPhotos.filter((p) => p.uploadedBy !== user?.uid);
  }, [data?.pages, uploaderFilter, user?.uid]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleToggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleMove = () => {
    if (!allFolders || selectedIds.size === 0) return;

    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <MovePhotosSheet
          folders={allFolders}
          currentFolderId={folderId}
          selectedCount={selectedIds.size}
          onMove={async (targetFolderId) => {
            const targetFolder = allFolders.find((f) => f.id === targetFolderId);
            const count = selectedIds.size;
            await moveMutation.mutateAsync({
              photoIds: Array.from(selectedIds),
              targetFolderId,
            });
            close();
            setTimeout(unmount, 300);
            handleExitSelectMode();
            toast.success(`${count}장의 사진을 '${targetFolder?.name}'로 이동했어요`);
          }}
        />
      </Sheet>
    ));
  };

  const handleMenu = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <FolderMenuSheet
          onRename={() => {
            close();
            setTimeout(() => {
              unmount();
              handleRename();
            }, 300);
          }}
          onDelete={async () => {
            close();
            setTimeout(unmount, 300);
            handleDelete();
          }}
        />
      </Sheet>
    ));
  };

  const handleRename = () => {
    if (!folder) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <RenameFolderSheet
          currentName={folder.name}
          isPending={renameMutation.isPending}
          onSubmit={async (newName) => {
            await renameMutation.mutateAsync({ folderId, newName });
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleDelete = async () => {
    try {
      setDeleteError(null);
      await deleteMutation.mutateAsync(folderId);
      router.push('/photos');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '폴더 삭제에 실패했어요');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {isSelectMode ? (
        <SelectionModeBar
          selectedCount={selectedIds.size}
          onClose={handleExitSelectMode}
          onMove={handleMove}
        />
      ) : (
        <Header
          title={folderLoading ? '...' : (folder?.name ?? '폴더')}
          leftSlot={
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로">
              <ArrowLeft size={20} />
            </Button>
          }
          rightSlot={
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSelectMode(true)}
                aria-label="선택 모드"
                data-testid="select-mode-btn"
              >
                <CheckSquare size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMenu}
                aria-label="더보기"
                data-testid="folder-menu-btn"
              >
                <MoreVertical size={20} />
              </Button>
            </div>
          }
        />
      )}
      {deleteError && (
        <div className="max-w-5xl mx-auto w-full px-4 mt-2">
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" data-testid="delete-error">
            {deleteError}
          </div>
        </div>
      )}
      {!isSelectMode && (
        <UploaderFilterChips value={uploaderFilter} onChange={setUploaderFilter} />
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          {isLoading ? (
            <PhotoGrid photos={[]} isLoading />
          ) : filteredPhotos.length === 0 ? (
            <EmptyState
              icon="📷"
              title="이 폴더에 사진이 없어요"
              description="사진을 업로드해보세요"
            />
          ) : (
            <>
              <PhotoGrid
                photos={filteredPhotos}
                uploaderAvatars={uploaderAvatars}
                selectable={isSelectMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
              {isFetchingNextPage && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
