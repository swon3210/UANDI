import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  getFolders,
  getAllFolders,
  getFolder,
  createFolder,
  renameFolder,
  deleteFolder,
  getFolderPhotoCount,
} from '@/services/folders';

/** 페이지네이션된 폴더 목록 (폴더 탭용) */
export function useInfiniteFolders(coupleId: string | null) {
  return useInfiniteQuery({
    queryKey: ['folders', coupleId],
    queryFn: ({ pageParam }) => getFolders(coupleId!, pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.folders.length > 0 ? lastPage.lastDoc : undefined,
    enabled: !!coupleId,
  });
}

/** 전체 폴더 목록 (업로드 시트의 폴더 선택 등) */
export function useFolders(coupleId: string | null) {
  return useQuery({
    queryKey: ['allFolders', coupleId],
    queryFn: () => getAllFolders(coupleId!),
    enabled: !!coupleId,
  });
}

export function useFolder(coupleId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['folder', coupleId, folderId],
    queryFn: () => getFolder(coupleId!, folderId!),
    enabled: !!coupleId && !!folderId,
  });
}

export function useFolderPhotoCount(coupleId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['folderPhotoCount', coupleId, folderId],
    queryFn: () => getFolderPhotoCount(coupleId!, folderId!),
    enabled: !!coupleId && !!folderId,
  });
}

export function useCreateFolder(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, userId }: { name: string; userId: string }) =>
      createFolder(coupleId!, name, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['allFolders', coupleId] });
    },
  });
}

export function useRenameFolder(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, newName }: { folderId: string; newName: string }) =>
      renameFolder(coupleId!, folderId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['folder', coupleId] });
    },
  });
}

export function useDeleteFolder(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => deleteFolder(coupleId!, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', coupleId] });
    },
  });
}
