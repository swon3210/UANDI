import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  getRecentPhotos,
  getPhotos,
  getPhotosByFolder,
  getPhotosByTag,
  getAllTags,
} from '@/services/photos';

export function useRecentPhotos(coupleId: string | null) {
  return useQuery({
    queryKey: ['recentPhotos', coupleId],
    queryFn: () => getRecentPhotos(coupleId!, 3),
    enabled: !!coupleId,
  });
}

export function useInfinitePhotos(coupleId: string | null) {
  return useInfiniteQuery({
    queryKey: ['photos', coupleId],
    queryFn: ({ pageParam }) => getPhotos(coupleId!, pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.photos.length > 0 ? lastPage.lastDoc : undefined,
    enabled: !!coupleId,
  });
}

export function usePhotosByFolder(coupleId: string | null, folderId: string | null) {
  return useInfiniteQuery({
    queryKey: ['photos', coupleId, 'folder', folderId],
    queryFn: ({ pageParam }) => getPhotosByFolder(coupleId!, folderId!, pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.photos.length > 0 ? lastPage.lastDoc : undefined,
    enabled: !!coupleId && !!folderId,
  });
}

export function usePhotosByTag(coupleId: string | null, tagName: string | null) {
  return useInfiniteQuery({
    queryKey: ['photos', coupleId, 'tag', tagName],
    queryFn: ({ pageParam }) => getPhotosByTag(coupleId!, tagName!, pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.photos.length > 0 ? lastPage.lastDoc : undefined,
    enabled: !!coupleId && !!tagName,
  });
}

export function useTagSummary(coupleId: string | null) {
  return useQuery({
    queryKey: ['tags', coupleId],
    queryFn: () => getAllTags(coupleId!),
    enabled: !!coupleId,
  });
}
