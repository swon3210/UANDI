'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header, EmptyState, Button, Skeleton } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePhotosByTag } from '@/hooks/usePhotos';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { useCallback, useEffect, useRef } from 'react';

export default function TagDetailPage() {
  const params = useParams<{ tagName: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;
  const tagName = decodeURIComponent(params.tagName);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePhotosByTag(coupleId, tagName);

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

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={`#${tagName}`}
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로">
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          {isLoading ? (
            <PhotoGrid photos={[]} isLoading />
          ) : photos.length === 0 ? (
            <EmptyState
              icon="🏷️"
              title={`#${tagName} 태그가 있는 사진이 없어요`}
              description="다른 태그를 찾아보세요"
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
