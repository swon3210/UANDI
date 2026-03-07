import { useQuery } from '@tanstack/react-query';
import { getRecentPhotos } from '@/services/photos';

export function useRecentPhotos(coupleId: string | null) {
  return useQuery({
    queryKey: ['recentPhotos', coupleId],
    queryFn: () => getRecentPhotos(coupleId!, 3),
    enabled: !!coupleId,
  });
}
