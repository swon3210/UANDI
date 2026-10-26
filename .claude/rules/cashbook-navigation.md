# 가계부 내비게이션: 대시보드 루트 + 뒤로가기 트리

가계부 서비스는 **대시보드(`/inner/cashbook`)를 유일한 루트**로 두고, 다른 페이지는 모두 거기서
드릴다운한다. 새 가계부 페이지를 만들거나 진입점을 바꿀 때 아래를 따른다.

## 규칙

1. **사이드바 토글(☰)은 대시보드에만** 둔다. 하위 페이지 헤더의 좌측은 항상 뒤로가기(←)다.
   - `PageHeader`를 쓰면 `leftSlot={<BackButton ... />}`를 반드시 넘긴다(생략 시 ☰가 붙는다).
2. 뒤로가기는 직접 구현하지 말고 **`@/components/shell/BackButton`** 을 쓴다.
   - 앱 안에서 이동해 왔으면 `router.back()`(대시보드 기간·필터 쿼리 복원),
     딥링크·새로고침 직후처럼 앱 내 기록이 없으면 `fallbackHref`(부모 경로)로 replace 한다.
   - 판단은 `NavigationTracker`(providers)가 기록하는 `@/lib/nav-history`로 한다.
     `window.history.length`는 앱 밖 기록까지 세므로 쓰지 않는다.
   - `fallbackHref`는 **트리상 부모**로 지정한다. 생략하면 대시보드.
3. 상단 분류 탭(대시보드/내역/…)은 두지 않는다. 진입점은 부모 페이지 안의 버튼/링크로 만든다.
4. 헤더 제목은 페이지 이름 그대로("내역", "현금흐름" 등). 하위 페이지에 "가계부"를 제목으로 쓰지 않는다.

## 현재 트리

```
대시보드 /inner/cashbook                (☰ 사이드바)
├─ 내역 /history                        ← 헤더 "내역" 버튼
│  └─ 현금흐름 /cashflow                 ← 내역의 "예상금액 조회하기"
├─ 점검 /review
├─ 카테고리 분석 /analysis               ← 평소와 비교 카드
└─ 가계부 설정 /settings                 ← 프로필 메뉴 → 설정
   ├─ 경제 목표 /plan/annual (+ wizard·items·bulk-edit)
   ├─ 카테고리 /categories → 미분류 /categories/orphans
   └─ 알림 /history/weekly/notifications
```

올해 목표가 없으면 대시보드 진입 시 목표 위저드로 연 1회 자동 이동한다(`useCashbookEntryAutoOpen`).
