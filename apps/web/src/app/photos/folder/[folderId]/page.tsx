'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, CheckSquare, Plus } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Header, EmptyState, Button, Sheet, Skeleton } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useFolder,
  useRenameFolder,
  useDeleteFolder,
  useFolders,
  useFolderAncestors,
  useInfiniteFolders,
  useCreateFolder,
  useFolderDescendantCount,
} from '@/hooks/useFolders';
import {
  usePhotosByFolder,
  useMovePhotos,
  useUploadPhotos,
  usePhotoStats,
} from '@/hooks/usePhotos';
import { useUploaderAvatars } from '@/hooks/useCoupleMembers';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { FolderMenuSheet } from '@/components/photos/FolderMenuSheet';
import { RenameFolderSheet } from '@/components/photos/RenameFolderSheet';
import { CreateFolderSheet } from '@/components/photos/CreateFolderSheet';
import { FolderBreadcrumb } from '@/components/photos/FolderBreadcrumb';
import { SubFolderSection } from '@/components/photos/SubFolderSection';
import { DeleteFolderConfirmSheet } from '@/components/photos/DeleteFolderConfirmSheet';
import { UploaderFilterChips, type UploaderFilter } from '@/components/photos/UploaderFilterChips';
import { SelectionModeBar } from '@/components/photos/SelectionModeBar';
import { MovePhotosSheet } from '@/components/photos/MovePhotosSheet';
import { PhotoUploadSheet } from '@/components/photos/PhotoUploadSheet';
import { useMemo, useState } from 'react';

export default function FolderDetailPage() {
  const params = useParams<{ folderId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;
  const folderId = params.folderId;

  const { data: folder, isLoading: folderLoading } = useFolder(coupleId, folderId);
  const { data: ancestors } = useFolderAncestors(coupleId, folder ?? null);
  const {
    data: subFoldersData,
    isLoading: subFoldersLoading,
  } = useInfiniteFolders(coupleId, folderId);
  const subFolders = useMemo(
    () => subFoldersData?.pages.flatMap((p) => p.folders) ?? [],
    [subFoldersData?.pages]
  );

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePhotosByFolder(coupleId, folderId);
  const { data: allFolders } = useFolders(coupleId);
  const { data: photoStats } = usePhotoStats(coupleId);
  const renameMutation = useRenameFolder(coupleId);
  const deleteMutation = useDeleteFolder(coupleId);
  const createMutation = useCreateFolder(coupleId);
  const moveMutation = useMovePhotos(coupleId);
  const uploadMutation = useUploadPhotos();
  const uploaderAvatars = useUploaderAvatars(coupleId);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const tagSuggestions = useMemo(
    () => photoStats?.tags.map((t) => t.name) ?? [],
    [photoStats?.tags]
  );

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

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

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

  const handleUpload = () => {
    if (!user || !coupleId || !folder) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <PhotoUploadSheet
          folders={allFolders ?? []}
          tagSuggestions={tagSuggestions}
          defaultFolderId={folder.id}
          onCreateFolder={async (name) =>
            createMutation.mutateAsync({ name, userId: user.uid })
          }
          onSubmit={async (data, onProgress) => {
            try {
              await uploadMutation.mutateAsync({
                files: data.files.map((f) => ({ file: f.file })),
                coupleId,
                uploadedBy: user.uid,
                folderId: data.folderId,
                tags: data.tags,
                caption: data.caption,
                takenAt: dayjs(data.takenAt).toDate(),
                onProgress,
              });
              close();
              setTimeout(unmount, 300);
            } catch {
              toast.error('사진 업로드에 실패했어요. 다시 시도해주세요.');
              throw new Error('upload failed');
            }
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
          onDelete={() => {
            close();
            setTimeout(() => {
              unmount();
              handleDelete();
            }, 300);
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

  const handleCreateSubFolder = () => {
    if (!folder || !user) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CreateFolderSheet
          isPending={createMutation.isPending}
          onSubmit={async (name) => {
            try {
              await createMutation.mutateAsync({
                name,
                userId: user.uid,
                parentFolderId: folder.id,
              });
              close();
              setTimeout(unmount, 300);
            } catch (err) {
              const msg = err instanceof Error ? err.message : '하위 폴더를 만들지 못했어요';
              toast.error(msg);
            }
          }}
        />
      </Sheet>
    ));
  };

  const handleDelete = () => {
    if (!folder) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <DeleteFolderConfirmDialog
        folder={folder}
        coupleId={coupleId}
        isOpen={isOpen}
        isDeleting={deleteMutation.isPending}
        onConfirm={async () => {
          try {
            setDeleteError(null);
            await deleteMutation.mutateAsync(folder.id);
            close();
            setTimeout(unmount, 300);
            router.push('/photos?tab=folders');
          } catch (err) {
            const msg = err instanceof Error ? err.message : '폴더 삭제에 실패했어요';
            setDeleteError(msg);
            close();
            setTimeout(unmount, 300);
          }
        }}
        onClose={() => {
          close();
          setTimeout(unmount, 300);
        }}
      />
    ));
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
                onClick={handleUpload}
                aria-label="사진 업로드"
                data-testid="folder-upload-btn"
                data-auth-ready={!!user && !!coupleId && !!folder ? 'true' : 'false'}
              >
                <Plus size={20} />
              </Button>
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
      {!isSelectMode && folder && (
        <FolderBreadcrumb ancestors={ancestors ?? []} current={folder} />
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
      <div className="flex-1">
        <div className="max-w-5xl mx-auto w-full">
          {folder && !isSelectMode && (
            <SubFolderSection
              parentDepth={folder.depth}
              subFolders={subFolders}
              isLoading={subFoldersLoading}
              onCreateClick={handleCreateSubFolder}
            />
          )}
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
                onPhotoClick={(index) =>
                  router.push(
                    `/photos/slideshow?source=folder&id=${folderId}&photoId=${filteredPhotos[index].id}`
                  )
                }
              />
              {isFetchingNextPage && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full" />
                  ))}
                </div>
              )}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type DeleteFolderConfirmDialogProps = {
  folder: { id: string; name: string };
  coupleId: string | null;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

function DeleteFolderConfirmDialog({
  folder,
  coupleId,
  isOpen,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteFolderConfirmDialogProps) {
  const { data: count, isLoading } = useFolderDescendantCount(coupleId, folder.id);
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DeleteFolderConfirmSheet
        folderName={folder.name}
        count={count ?? null}
        isLoading={isLoading}
        isDeleting={isDeleting}
        onConfirm={onConfirm}
        onCancel={onClose}
      />
    </Sheet>
  );
}
