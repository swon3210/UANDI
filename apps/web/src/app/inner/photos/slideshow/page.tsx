'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAllPhotos, useAllPhotosByFolder, useAllPhotosByTag } from '@/hooks/usePhotos';
import { useFolder, useFolders } from '@/hooks/useFolders';
import { findNextNonEmptySiblingFolderId } from '@/services/folders';
import { SlideshowView } from '@/components/photos/SlideshowView';
import { MascotLoader } from '@/components/MascotLoader';

type Source = 'all' | 'folder' | 'tag';

function SlideshowContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authStatus } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const source = searchParams.get('source') as Source | null;
  const id = searchParams.get('id');
  const photoId = searchParams.get('photoId');
  const cycleNonce = searchParams.get('t');

  const isAllSource = source === 'all';
  const isFolderSource = source === 'folder';
  const isTagSource = source === 'tag';

  const allQuery = useAllPhotos(isAllSource ? coupleId : null);
  const folderQuery = useAllPhotosByFolder(
    isFolderSource ? coupleId : null,
    isFolderSource ? id : null
  );
  const tagQuery = useAllPhotosByTag(isTagSource ? coupleId : null, isTagSource ? id : null);
  const { data: folder } = useFolder(isFolderSource ? coupleId : null, isFolderSource ? id : null);
  const { data: folders } = useFolders(isFolderSource ? coupleId : null);

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

  const handleLastPhotoNext = useCallback(async () => {
    if (!isFolderSource || !coupleId || !id || !folders) return;
    const nextId = await findNextNonEmptySiblingFolderId(coupleId, folders, id);
    if (nextId) {
      router.replace(`/inner/photos/slideshow?source=folder&id=${nextId}`);
    } else {
      // 갈 곳 없음(자기 1개뿐/모두 빈 폴더) → 같은 폴더 첫 사진으로 순환.
      // URL이 동일하면 라우터가 무시하므로 nonce(t)를 붙여 강제로 리마운트한다.
      router.replace(`/inner/photos/slideshow?source=folder&id=${id}&t=${Date.now()}`);
    }
  }, [isFolderSource, coupleId, id, folders, router]);

  if (invalidParams || authStatus === 'loading' || !isFetched || photos.length === 0) {
    return <MascotLoader fullScreen />;
  }

  return (
    <SlideshowView
      key={`${source}-${id ?? 'all'}-${cycleNonce ?? ''}`}
      photos={photos}
      initialIndex={initialIndex}
      folder={isFolderSource ? folder : undefined}
      onClose={() => router.back()}
      onLastPhotoNext={isFolderSource ? handleLastPhotoNext : undefined}
    />
  );
}

export default function SlideshowPage() {
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <SlideshowContent />
    </Suspense>
  );
}
