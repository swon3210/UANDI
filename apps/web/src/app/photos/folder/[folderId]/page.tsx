'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { Header, EmptyState, Button, Sheet, Skeleton } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useFolder, useRenameFolder, useDeleteFolder } from '@/hooks/useFolders';
import { usePhotosByFolder } from '@/hooks/usePhotos';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { FolderMenuSheet } from '@/components/photos/FolderMenuSheet';
import { RenameFolderSheet } from '@/components/photos/RenameFolderSheet';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function FolderDetailPage() {
  const params = useParams<{ folderId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;
  const folderId = params.folderId;

  const { data: folder, isLoading: folderLoading } = useFolder(coupleId, folderId);
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePhotosByFolder(coupleId, folderId);
  const renameMutation = useRenameFolder(coupleId);
  const deleteMutation = useDeleteFolder(coupleId);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const photos = data?.pages.flatMap((p) => p.photos) ?? [];
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
      <Header
        title={folderLoading ? '...' : (folder?.name ?? '폴더')}
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로">
            <ArrowLeft size={20} />
          </Button>
        }
        rightSlot={
          <Button variant="ghost" size="icon" onClick={handleMenu} aria-label="더보기" data-testid="folder-menu-btn">
            <MoreVertical size={20} />
          </Button>
        }
      />
      {deleteError && (
        <div className="max-w-5xl mx-auto w-full px-4 mt-2">
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive" data-testid="delete-error">
            {deleteError}
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          {isLoading ? (
            <PhotoGrid photos={[]} isLoading />
          ) : photos.length === 0 ? (
            <EmptyState
              icon="📷"
              title="이 폴더에 사진이 없어요"
              description="사진을 업로드해보세요"
            />
          ) : (
            <>
              <PhotoGrid photos={photos} />
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
