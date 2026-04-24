import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  getRecentPhotos,
  getPhotos,
  getPhoto,
  getPhotosByFolder,
  getPhotosByTag,
  getPhotoStats,
  addPhoto,
  updatePhoto,
  deletePhotoDoc,
  movePhotosToFolder,
  getFolderStat,
  getAllPhotosByFolder,
  getAllPhotosByTag,
  type AddPhotoInput,
  type UpdatePhotoInput,
} from '@/services/photos';
import { uploadPhotoFile, deletePhotoFile } from '@/lib/firebase/storage';

export function useRecentPhotos(coupleId: string | null) {
  return useQuery({
    queryKey: ['recentPhotos', coupleId],
    queryFn: () => getRecentPhotos(coupleId!, 3),
    enabled: !!coupleId,
  });
}

export function usePhoto(coupleId: string | null, photoId: string | null) {
  return useQuery({
    queryKey: ['photo', coupleId, photoId],
    queryFn: () => getPhoto(coupleId!, photoId!),
    enabled: !!coupleId && !!photoId,
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

// 태그 집계 + 폴더별 사진 수를 단일 쿼리로 가져옴
export function usePhotoStats(coupleId: string | null) {
  return useQuery({
    queryKey: ['photoStats', coupleId],
    queryFn: () => getPhotoStats(coupleId!),
    enabled: !!coupleId,
  });
}

export function useTagSummary(coupleId: string | null) {
  const { data: stats, ...rest } = usePhotoStats(coupleId);
  return { data: stats?.tags, ...rest };
}

export function useFolderPhotoCounts(coupleId: string | null) {
  const { data: stats, ...rest } = usePhotoStats(coupleId);
  return { data: stats?.folderCounts, ...rest };
}

export function useFolderCovers(coupleId: string | null) {
  const { data: stats, ...rest } = usePhotoStats(coupleId);
  return { data: stats?.folderCovers, ...rest };
}

/** 폴더 내 전체 사진 (슬라이드쇼용) */
export function useAllPhotosByFolder(coupleId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['allPhotos', coupleId, 'folder', folderId],
    queryFn: () => getAllPhotosByFolder(coupleId!, folderId!),
    enabled: !!coupleId && !!folderId,
  });
}

/** 태그별 전체 사진 (슬라이드쇼용) */
export function useAllPhotosByTag(coupleId: string | null, tagName: string | null) {
  return useQuery({
    queryKey: ['allPhotos', coupleId, 'tag', tagName],
    queryFn: () => getAllPhotosByTag(coupleId!, tagName!),
    enabled: !!coupleId && !!tagName,
  });
}

export function useFolderStat(coupleId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['folderStat', coupleId, folderId],
    queryFn: () => getFolderStat(coupleId!, folderId!),
    enabled: !!coupleId && !!folderId,
  });
}

// --- Mutations ---

type UploadFileEntry = {
  file: File;
};

type UploadPhotosParams = {
  files: UploadFileEntry[];
  coupleId: string;
  uploadedBy: string;
  folderId: string;
  tags: string[];
  caption: string;
  takenAt: Date;
  onProgress?: (percent: number, current: number, total: number) => void;
};

async function readImageSize(blob: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    try {
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close?.();
    }
  }
  // Safari 폴백
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadPhotosParams) => {
      const { files, onProgress } = params;
      const total = files.length;
      // 압축(Web Worker) + 업로드를 한 파이프라인으로 묶어 동시성 제한.
      // 너무 크게 잡으면 워커·디코드 메모리가 폭증하고 탭이 터짐. 80장 이상에서도 안전한 수준.
      const CONCURRENCY = 3;

      const imageCompression = (await import('browser-image-compression')).default;

      let completedCount = 0;
      const photoIds: string[] = new Array(total);

      const processOne = async (index: number) => {
        const entry = files[index];
        let fileToUpload: File = entry.file;
        if (entry.file.size > 1.5 * 1024 * 1024) {
          fileToUpload = await imageCompression(entry.file, {
            maxWidthOrHeight: 1920,
            initialQuality: 0.85,
            useWebWorker: true,
          });
        }

        const { width, height } = await readImageSize(fileToUpload);

        const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const storageUrl = await uploadPhotoFile({
          coupleId: params.coupleId,
          photoId: tempId,
          file: fileToUpload,
        });

        const input: AddPhotoInput = {
          coupleId: params.coupleId,
          uploadedBy: params.uploadedBy,
          folderId: params.folderId,
          tags: params.tags,
          storageUrl,
          caption: params.caption,
          takenAt: params.takenAt,
          width,
          height,
        };

        const photoId = await addPhoto(input);
        photoIds[index] = photoId;

        completedCount++;
        const overall = Math.round((completedCount / total) * 100);
        onProgress?.(overall, completedCount, total);
      };

      // 워커 풀 패턴: 파일 단위 파이프라인(압축→크기→업로드→Firestore)을 동시성 제한해 실행
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < total) {
          const idx = nextIndex++;
          await processOne(idx);
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()));

      return photoIds;
    },
    onSuccess: (_photoIds, params) => {
      queryClient.invalidateQueries({ queryKey: ['photos', params.coupleId] });
      queryClient.invalidateQueries({ queryKey: ['recentPhotos', params.coupleId] });
      queryClient.invalidateQueries({ queryKey: ['photoStats', params.coupleId] });
    },
  });
}

export function useUpdatePhoto(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, updates }: { photoId: string; updates: UpdatePhotoInput }) =>
      updatePhoto(coupleId!, photoId, updates),
    onSuccess: (_data, { photoId }) => {
      queryClient.invalidateQueries({ queryKey: ['photo', coupleId, photoId] });
      queryClient.invalidateQueries({ queryKey: ['photos', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['photoStats', coupleId] });
    },
  });
}

export function useMovePhotos(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoIds, targetFolderId }: { photoIds: string[]; targetFolderId: string }) =>
      movePhotosToFolder(coupleId!, photoIds, targetFolderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['photoStats', coupleId] });
    },
  });
}

export function useDeletePhoto(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, storageUrl }: { photoId: string; storageUrl?: string }) => {
      // Storage 삭제 (실패해도 Firestore 삭제 진행)
      try {
        await deletePhotoFile(coupleId!, photoId, storageUrl);
      } catch {
        // storage 파일이 없을 수 있음
      }
      await deletePhotoDoc(coupleId!, photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['recentPhotos', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['photoStats', coupleId] });
    },
  });
}
