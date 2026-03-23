'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import {
  Header,
  EmptyState,
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Sheet,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  FullScreenSpinner,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePhoto, useUpdatePhoto, useDeletePhoto, useTagSummary } from '@/hooks/usePhotos';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFolders } from '@/hooks/useFolders';
import { PhotoEditSheet } from '@/components/photos/PhotoEditSheet';

function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사진 삭제</DialogTitle>
          <DialogDescription>이 사진을 삭제하면 복구할 수 없어요. 삭제할까요?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PhotoDetailViewProps = {
  photoId: string;
};

export function PhotoDetailView({ photoId }: PhotoDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const { data: photo, isLoading } = usePhoto(coupleId, photoId);
  const { data: folders } = useFolders(coupleId);
  const { data: tagSummary } = useTagSummary(coupleId);
  const { data: uploader } = useUserProfile(photo?.uploadedBy ?? null);
  const updateMutation = useUpdatePhoto(coupleId);
  const deleteMutation = useDeletePhoto(coupleId);

  const folder = folders?.find((f) => f.id === photo?.folderId);
  const tagSuggestions = tagSummary?.map((t) => t.name) ?? [];

  const handleEdit = () => {
    if (!photo || !folders) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <PhotoEditSheet
          photo={photo}
          folders={folders}
          tagSuggestions={tagSuggestions}
          isPending={updateMutation.isPending}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({
              photoId: photo.id,
              updates: {
                folderId: data.folderId,
                tags: data.tags,
                caption: data.caption,
              },
            });
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleDelete = async () => {
    if (!photo) return;
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <DeleteConfirmDialog
        isOpen={isOpen}
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

    if (confirmed) {
      await deleteMutation.mutateAsync({ photoId: photo.id, storageUrl: photo.storageUrl });
      router.push('/photos');
    }
  };

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!photo) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header
          title=""
          leftSlot={
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로가기">
              <ArrowLeft size={20} />
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon="📷"
            title="사진을 찾을 수 없습니다"
            description="삭제되었거나 존재하지 않는 사진이에요"
          />
        </div>
      </div>
    );
  }

  const takenAtFormatted = photo.takenAt
    ? dayjs(photo.takenAt.toDate()).format('YYYY년 M월 D일')
    : '';

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title=""
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로가기">
            <ArrowLeft size={20} />
          </Button>
        }
        rightSlot={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="더보기 메뉴"
                data-testid="photo-more-menu"
              >
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil size={16} className="mr-2" />
                편집
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 size={16} className="mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <main className="flex-1 max-w-5xl mx-auto w-full">
        {/* 이미지 */}
        <div className="relative w-full" data-testid="photo-detail-image">
          <Image
            src={photo.storageUrl}
            alt={photo.caption || '사진'}
            width={photo.width}
            height={photo.height}
            className="w-full object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* 메타 정보 */}
        <div className="px-4 py-4 space-y-3">
          {/* 폴더 */}
          {folder && (
            <Link
              href={`/photos/folder/${folder.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              data-testid="photo-folder-link"
            >
              <span>📁</span>
              {folder.name}
            </Link>
          )}

          {/* 태그 */}
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5" data-testid="photo-tags">
              {photo.tags.map((tag) => (
                <Link key={tag} href={`/photos/tag/${encodeURIComponent(tag)}`}>
                  <Badge variant="secondary" className="cursor-pointer">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* 날짜 + 업로더 */}
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            data-testid="photo-meta"
          >
            {takenAtFormatted && <span>{takenAtFormatted}</span>}
            {uploader && (
              <>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    {uploader.photoURL && (
                      <AvatarImage src={uploader.photoURL} alt={uploader.displayName} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {uploader.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span data-testid="photo-uploader">{uploader.displayName}이(가) 올림</span>
                </div>
              </>
            )}
          </div>

          {/* 캡션 */}
          {photo.caption && (
            <p className="text-sm" data-testid="photo-caption">
              {photo.caption}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
