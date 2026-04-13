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
  width: number;
  height: number;
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

export function useUploadPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadPhotosParams) => {
      const { files, onProgress } = params;
      const total = files.length;
      const CONCURRENCY = 5;

      // 1단계: 이미지 압축 병렬 처리
      const imageCompression = (await import('browser-image-compression')).default;
      const compressed = await Promise.all(
        files.map(async (entry) => {
          let fileToUpload = entry.file;
          if (entry.file.size > 1.5 * 1024 * 1024) {
            fileToUpload = await imageCompression(entry.file, {
              maxWidthOrHeight: 1920,
              initialQuality: 0.85,
              useWebWorker: true,
            });
          }
          return { ...entry, file: fileToUpload };
        })
      );

      // 2단계: 업로드 + Firestore 저장을 동시성 제한하여 병렬 실행
      let completedCount = 0;
      const photoIds: string[] = new Array(total);

      const uploadOne = async (index: number) => {
        const entry = compressed[index];
        const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const storageUrl = await uploadPhotoFile({
          coupleId: params.coupleId,
          photoId: tempId,
          file: entry.file,
          onProgress: () => {
            // 개별 파일 진행률은 생략하고 완료 기준으로 전체 진행률 보고
          },
        });

        const input: AddPhotoInput = {
          coupleId: params.coupleId,
          uploadedBy: params.uploadedBy,
          folderId: params.folderId,
          tags: params.tags,
          storageUrl,
          caption: params.caption,
          takenAt: params.takenAt,
          width: entry.width,
          height: entry.height,
        };

        const photoId = await addPhoto(input);
        photoIds[index] = photoId;

        completedCount++;
        const overall = Math.round((completedCount / total) * 100);
        onProgress?.(overall, completedCount, total);
      };

      // 동시성 제한 실행 (worker pool 패턴)
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < total) {
          const idx = nextIndex++;
          await uploadOne(idx);
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
