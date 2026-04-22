import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  getFoldersByParent,
  getAllFolders,
  getFolder,
  getFolderAncestors,
  createFolder,
  renameFolder,
  deleteFolder,
  getFolderPhotoCount,
  countFolderDescendants,
} from '@/services/folders';
import type { Folder } from '@/types';

/** 페이지네이션된 폴더 목록 (특정 부모 아래) */
export function useInfiniteFolders(coupleId: string | null, parentFolderId: string | null) {
  return useInfiniteQuery({
    queryKey: ['folders', coupleId, parentFolderId],
    queryFn: ({ pageParam }) => getFoldersByParent(coupleId!, parentFolderId, pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.folders.length > 0 ? lastPage.lastDoc : undefined,
    enabled: !!coupleId,
  });
}

/** 전체 폴더 목록 (Combobox 등) */
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

export function useFolderAncestors(coupleId: string | null, folder: Folder | null | undefined) {
  return useQuery({
    queryKey: ['folderAncestors', coupleId, folder?.id, folder?.path],
    queryFn: () => getFolderAncestors(coupleId!, folder!),
    enabled: !!coupleId && !!folder,
  });
}

export function useFolderPhotoCount(coupleId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['folderPhotoCount', coupleId, folderId],
    queryFn: () => getFolderPhotoCount(coupleId!, folderId!),
    enabled: !!coupleId && !!folderId,
  });
}

export function useFolderDescendantCount(coupleId: string | null, folderId: string | null) {
  return useQuery({
    queryKey: ['folderDescendantCount', coupleId, folderId],
    queryFn: () => countFolderDescendants(coupleId!, folderId!),
    enabled: !!coupleId && !!folderId,
  });
}

export function useCreateFolder(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      userId,
      parentFolderId = null,
    }: {
      name: string;
      userId: string;
      parentFolderId?: string | null;
    }) => createFolder(coupleId!, name, userId, parentFolderId),
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
      queryClient.invalidateQueries({ queryKey: ['allFolders', coupleId] });
    },
  });
}

export function useDeleteFolder(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => deleteFolder(coupleId!, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['allFolders', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['photos', coupleId] });
      queryClient.invalidateQueries({ queryKey: ['photoStats', coupleId] });
    },
  });
}
