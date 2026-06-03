import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSource,
  deleteSource,
  fetchSources,
  triggerCrawl,
  updateSource,
} from '@/services/community-sources';

const SOURCES_KEY = ['communitySources'];

export function useCommunitySources(enabled: boolean) {
  return useQuery({
    queryKey: SOURCES_KEY,
    queryFn: fetchSources,
    enabled,
    staleTime: 0,
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

export function useTriggerCrawl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerCrawl,
    onSuccess: () => {
      // 수집 결과로 pending 글·소스 메타가 바뀌므로 모더레이션 목록·소스 목록을 갱신.
      queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
      queryClient.invalidateQueries({ queryKey: ['moderationLists'] });
    },
  });
}
