import { useEffect } from 'react';
import { useIntersectionObserver } from '@uidotdev/usehooks';

type UseInfiniteScrollOptions = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
};

/**
 * IntersectionObserver 기반 무한 스크롤 훅.
 * 반환된 ref를 sentinel 요소에 연결하면 뷰포트 근처 진입 시 자동으로 다음 페이지를 로드한다.
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '200px',
}: UseInfiniteScrollOptions) {
  const [sentinelRef, entry] = useIntersectionObserver({
    threshold: 0,
    rootMargin,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return sentinelRef;
}
