'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { overlay } from 'overlay-kit';
import {
  Header,
  EmptyState,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Skeleton,
  Sheet,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useInfinitePhotos, useTagSummary } from '@/hooks/usePhotos';
import { useFolders, useCreateFolder } from '@/hooks/useFolders';
import { BottomNav } from '@/components/BottomNav';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { FolderCard } from '@/components/photos/FolderCard';
import { CreateFolderSheet } from '@/components/photos/CreateFolderSheet';
import Link from 'next/link';

function AllPhotosTab({ coupleId }: { coupleId: string }) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfinitePhotos(coupleId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const photos = data?.pages.flatMap((p) => p.photos) ?? [];

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

  if (isLoading) {
    return <PhotoGrid photos={[]} isLoading />;
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        icon="📷"
        title="아직 사진이 없어요"
        description="소중한 순간을 함께 기록해보세요"
        action={
          <Button disabled>
            첫 사진 올리기
          </Button>
        }
      />
    );
  }

  return (
    <div ref={scrollRef} className="overflow-y-auto flex-1">
      <PhotoGrid photos={photos} />
      {isFetchingNextPage && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      )}
    </div>
  );
}

function FoldersTab({ coupleId }: { coupleId: string }) {
  const { user } = useAuth();
  const { data: folders, isLoading } = useFolders(coupleId);
  const createMutation = useCreateFolder(coupleId);

  const handleCreateFolder = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CreateFolderSheet
          isPending={createMutation.isPending}
          onSubmit={async (name) => {
            await createMutation.mutateAsync({ name, userId: user!.uid });
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end px-4 py-2">
        <Button variant="ghost" size="sm" onClick={handleCreateFolder} data-testid="create-folder-btn">
          <Plus size={16} className="mr-1" />
          새 폴더
        </Button>
      </div>
      {!folders || folders.length === 0 ? (
        <EmptyState
          icon="📁"
          title="폴더를 만들어 사진을 정리해보세요"
          description="여행, 일상 등 주제별로 사진을 분류할 수 있어요"
          action={
            <Button onClick={handleCreateFolder}>
              새 폴더 만들기
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              coverUrl={null}
              photoCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TagsTab({ coupleId }: { coupleId: string }) {
  const { data: tags, isLoading } = useTagSummary(coupleId);

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <EmptyState
        icon="🏷️"
        title="사진에 태그를 추가해보세요"
        description="태그로 사진을 쉽게 찾을 수 있어요"
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {tags.map((tag) => (
        <Link key={tag.name} href={`/photos/tag/${encodeURIComponent(tag.name)}`}>
          <Badge variant="secondary" className="cursor-pointer text-sm py-1.5 px-3">
            #{tag.name} ({tag.count})
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export function PhotosGallery() {
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Header
        title="사진"
        rightSlot={
          <Button variant="ghost" size="icon" disabled aria-label="사진 업로드">
            <Plus size={20} />
          </Button>
        }
      />
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none bg-background h-11">
            <TabsTrigger value="all" className="flex-1" data-testid="tab-all">
              전체
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex-1" data-testid="tab-folders">
              폴더
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex-1" data-testid="tab-tags">
              태그
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="flex-1 mt-0">
            {coupleId && <AllPhotosTab coupleId={coupleId} />}
          </TabsContent>
          <TabsContent value="folders" className="flex-1 mt-0">
            {coupleId && <FoldersTab coupleId={coupleId} />}
          </TabsContent>
          <TabsContent value="tags" className="flex-1 mt-0">
            {coupleId && <TagsTab coupleId={coupleId} />}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav activeTab="photos" />
    </div>
  );
}
