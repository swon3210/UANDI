---
title: '사진 갤러리 구현 기록'
date: '2026-03-21'
summary: '무한 스크롤과 이미지 프리로딩을 구현한 과정을 정리합니다.'
tags: ['photos', 'performance']
---

## 배경

사진 갤러리는 UANDI의 핵심 기능이다. 커플이 함께 찍은 사진을 폴더별로 정리하고, 태그로 검색할 수 있어야 한다.

처음에는 모든 사진을 한 번에 불러왔는데, 사진이 많아지면 초기 로딩이 느려지는 문제가 있었다.

## 구현 내용

TanStack Query의 `useInfiniteQuery`를 사용해 무한 스크롤을 구현했다.

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['photos', coupleId, folderId],
  queryFn: ({ pageParam }) => getPhotos({ coupleId, folderId, cursor: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

## 기술적 결정

`react-virtualized` 대신 단순 무한 스크롤을 선택했다.

- 사진 그리드는 높이가 고정이라 가상화의 이점이 크지 않음
- 한 번에 20개씩 로드하면 DOM 노드 수가 관리 가능한 수준

## 배운 것

다음 페이지의 이미지를 미리 불러오는 프리로딩을 추가하니 체감 속도가 크게 개선되었다.
`useIntersectionObserver`의 `threshold`를 0.1로 설정해서 스크롤 끝에 도달하기 직전에 다음 페이지를 요청했다.
