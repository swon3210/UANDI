import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFolders,
  getFolder,
  createFolder,
  renameFolder,
  deleteFolder,
  getFolderPhotoCount,
} from '@/services/folders';

export function useFolders(coupleId: string | null) {
  return useQuery({
    queryKey: ['folders', coupleId],
    queryFn: () => getFolders(coupleId!),
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
