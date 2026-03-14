'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { FullScreenSpinner } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePhotosByFolder, usePhotosByTag } from '@/hooks/usePhotos';
import { useFolder } from '@/hooks/useFolders';
import { SlideshowView } from '@/components/photos/SlideshowView';

function SlideshowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authStatus } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const source = searchParams.get('source') as 'folder' | 'tag' | null;
  const id = searchParams.get('id');

  const isFolderSource = source === 'folder';
  const isTagSource = source === 'tag';

  const folderQuery = usePhotosByFolder(
    isFolderSource ? coupleId : null,
    isFolderSource ? id : null
  );
  const tagQuery = usePhotosByTag(
    isTagSource ? coupleId : null,
    isTagSource ? id : null
  );
  const { data: folder } = useFolder(
    isFolderSource ? coupleId : null,
    isFolderSource ? id : null
  );

  const activeQuery = isFolderSource ? folderQuery : tagQuery;
  const photos = activeQuery.data?.pages.flatMap((p) => p.photos) ?? [];
  const isFetched = activeQuery.isFetched;

  const hasRedirected = useRef(false);

  // 파라미터 없으면 즉시 리다이렉트, 데이터 로드 완료 후 사진 없으면 리다이렉트
  const invalidParams = !source || !id;
  const emptyAfterFetch = isFetched && photos.length === 0;
  const shouldRedirect = invalidParams || emptyAfterFetch;

  useEffect(() => {
    if (shouldRedirect && !hasRedirected.current) {
      hasRedirected.current = true;
      router.back();
    }
  }, [shouldRedirect, router]);

  if (invalidParams || authStatus === 'loading' || !isFetched || photos.length === 0) {
    return <FullScreenSpinner />;
  }

  return (
    <SlideshowView
      photos={photos}
      folder={isFolderSource ? folder : undefined}
      onClose={() => router.back()}
    />
  );
}

export default function SlideshowPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <SlideshowContent />
    </Suspense>
  );
}
