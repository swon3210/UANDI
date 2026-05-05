'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { FullScreenSpinner } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllPhotos,
  useAllPhotosByFolder,
  useAllPhotosByTag,
} from '@/hooks/usePhotos';
import { useFolder } from '@/hooks/useFolders';
import { SlideshowView } from '@/components/photos/SlideshowView';

type Source = 'all' | 'folder' | 'tag';

function SlideshowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authStatus } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const source = searchParams.get('source') as Source | null;
  const id = searchParams.get('id');
  const photoId = searchParams.get('photoId');

  const isAllSource = source === 'all';
  const isFolderSource = source === 'folder';
  const isTagSource = source === 'tag';

  const allQuery = useAllPhotos(isAllSource ? coupleId : null);
  const folderQuery = useAllPhotosByFolder(
    isFolderSource ? coupleId : null,
    isFolderSource ? id : null
  );
  const tagQuery = useAllPhotosByTag(
    isTagSource ? coupleId : null,
    isTagSource ? id : null
  );
  const { data: folder } = useFolder(
    isFolderSource ? coupleId : null,
    isFolderSource ? id : null
  );

  const activeQuery = isAllSource ? allQuery : isFolderSource ? folderQuery : tagQuery;
  const photos = useMemo(() => activeQuery.data ?? [], [activeQuery.data]);
  const isFetched = activeQuery.isFetched;

  const initialIndex = useMemo(() => {
    if (!photoId) return 0;
    const idx = photos.findIndex((p) => p.id === photoId);
    return idx >= 0 ? idx : 0;
  }, [photos, photoId]);

  const hasRedirected = useRef(false);

  // 파라미터 검증: source 필수, folder/tag일 때만 id 필수
  const invalidParams =
    !source ||
    (isFolderSource && !id) ||
    (isTagSource && !id) ||
    (!isAllSource && !isFolderSource && !isTagSource);
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
      initialIndex={initialIndex}
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
