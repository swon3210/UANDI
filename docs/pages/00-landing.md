# 페이지 명세: 랜딩 & 로그인 (/)

## 목적

비로그인 사용자가 처음 진입하는 페이지. 서비스를 소개하고 Google 소셜 로그인을 제공합니다.
로그인 완료 후에는 사용자 상태에 따라 자동으로 적절한 페이지로 이동합니다.

> 로그인한 사용자가 `/`에 접근하면 대시보드를 표시합니다. 대시보드 명세는 `pages/02-dashboard.md`를 참조하세요.

---

## 사용자 여정

### 신규 사용자 (최초 방문)

```
/ 진입
  └─ auth 로딩 → 비로그인 확인 → 랜딩 페이지 표시
      └─ "구글로 시작하기" 클릭
          └─ Google OAuth 팝업
              └─ 로그인 성공
                  └─ users/{uid} 문서 없음 → 신규 문서 생성
                      └─ coupleId === null → /onboarding으로 이동
```

### 기존 사용자 (커플 연결 미완료)

```
/ 진입
  └─ auth 로딩 → 비로그인 확인 → 랜딩 페이지 표시
      └─ "구글로 시작하기" 클릭
          └─ Google OAuth 팝업
              └─ 로그인 성공
                  └─ users/{uid} 문서 이미 존재 → 그대로 사용
                      └─ coupleId === null → /onboarding으로 이동
```

### 기존 사용자 (커플 연결 완료)

```
/ 진입
  └─ auth 로딩 → 비로그인 확인 → 랜딩 페이지 표시
      └─ "구글로 시작하기" 클릭
          └─ Google OAuth 팝업
              └─ 로그인 성공
                  └─ users/{uid} 문서 이미 존재 → 그대로 사용
                      └─ coupleId !== null → / (대시보드)로 이동
```

---

## UI 구성

### 상태 1 — 초기 로딩 (auth 확인 중)

앱 첫 로드 시 Firebase가 이전 세션을 복원하는 동안 표시됩니다.

```
┌─────────────────────────┐
│                         │
│                         │
│       [로딩 스피너]      │  ← 전체 화면 중앙 정렬
│                         │
│                         │
└─────────────────────────┘
```

- `authStatus === 'loading'`일 때만 표시
- 이 화면이 너무 오래 보이면 UX가 나빠지므로 별도 타임아웃 처리 불필요 (Firebase가 빠르게 처리)

### 상태 2 — 랜딩 (비로그인)

```
┌─────────────────────────┐
│                         │
│   UANDI                 │  ← 로고
│                         │
│   둘이서 만드는          │
│   우리만의 일상          │  ← 헤드라인 (2줄)
│                         │
│   사진을 함께 모으고,    │
│   돈을 함께 관리하세요.  │  ← 서브 카피
│                         │
│   ┌───────────────────┐ │
│   │  구글로 시작하기   │ │  ← primary 버튼
│   └───────────────────┘ │
│                         │
└─────────────────────────┘
```

- 전체 화면 세로 중앙 정렬 (`flex flex-col items-center justify-center min-h-screen`)
- Bottom Nav 없음

### 상태 3 — 로그인 진행 중

"구글로 시작하기" 클릭 후 Google OAuth 팝업이 열려 있는 동안:

```
┌─────────────────────────┐
│                         │
│   UANDI                 │
│   ...                   │
│                         │
│   ┌───────────────────┐ │
│   │ ◌  로그인 중...   │ │  ← 버튼 비활성화, 스피너 + 텍스트 변경
│   └───────────────────┘ │
│                         │
└─────────────────────────┘
```

- 버튼에 `disabled` 속성
- 버튼 내부에 스피너 아이콘(`Loader2` from lucide) + "로그인 중..." 텍스트
- Google 팝업이 닫히면 (성공/실패 모두) 버튼 상태 복귀

### 상태 4 — 로그인 에러

```
┌─────────────────────────┐
│                         │
│   UANDI                 │
│   ...                   │
│                         │
│   ┌───────────────────┐ │
│   │  구글로 시작하기   │ │  ← 버튼 재활성화
│   └───────────────────┘ │
│   로그인 중 문제가       │
│   발생했어요. 다시       │  ← 에러 메시지 (버튼 아래)
│   시도해 주세요.         │
│                         │
└─────────────────────────┘
```

- 에러 메시지: `text-destructive text-sm text-center mt-2`
- 에러 발생 후 버튼은 즉시 재활성화

---

## 에러 처리

| Firebase 에러 코드 | 원인 | 사용자에게 표시할 메시지 |
| --- | --- | --- |
| `auth/popup-closed-by-user` | 사용자가 팝업을 직접 닫음 | 표시 안 함 (정상 취소로 처리) |
| `auth/popup-blocked` | 브라우저가 팝업 차단 | "팝업이 차단되었어요. 브라우저 설정에서 팝업을 허용해 주세요." |
| `auth/network-request-failed` | 네트워크 오류 | "네트워크 오류가 발생했어요. 연결 상태를 확인해 주세요." |
| 그 외 | Firebase 내부 오류 | "로그인 중 문제가 발생했어요. 다시 시도해 주세요." |

---

## 기술 명세

### 컴포넌트 구조

```tsx
// app/page.tsx

export default function HomePage() {
  const authStatus = useAtomValue(authStatusAtom);

  if (authStatus === 'loading') return <FullScreenSpinner />;
  if (authStatus === 'unauthenticated') return <LandingPage />;
  return <Dashboard />; // authenticated_with_couple
}
```

> `authenticated_no_couple` 상태는 `middleware.ts`가 `/onboarding`으로 리다이렉트하므로 여기서 처리할 필요 없습니다.

### 로그인 버튼 핸들러

```ts
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleLogin = async () => {
  setIsLoading(true);
  setError(null);
  try {
    await signInWithGoogle(); // lib/firebase/auth.ts
    // 성공 시: onAuthStateChanged가 상태 업데이트 → middleware가 라우팅 처리
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-closed-by-user') {
      // 조용히 무시 (정상 취소)
    } else if (code === 'auth/popup-blocked') {
      setError('팝업이 차단되었어요. 브라우저 설정에서 팝업을 허용해 주세요.');
    } else if (code === 'auth/network-request-failed') {
      setError('네트워크 오류가 발생했어요. 연결 상태를 확인해 주세요.');
    } else {
      setError('로그인 중 문제가 발생했어요. 다시 시도해 주세요.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

### 신규 유저 문서 생성 시점

Google 로그인 성공 시 `onAuthStateChanged` 콜백 내부에서 처리합니다.
이 로직은 `stores/auth.store.ts` 또는 `app/providers.tsx`에서 담당합니다.

```ts
onAuthStateChanged(async (firebaseUser) => {
  if (firebaseUser) {
    const existing = await getUserDocument(firebaseUser.uid);
    if (!existing) {
      // 신규 유저: Firestore users 문서 생성
      await createUserDocument(firebaseUser.uid, {
        displayName: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        photoURL: firebaseUser.photoURL ?? null,
        coupleId: null,
        createdAt: serverTimestamp(),
      });
    }
    setUser(existing ?? createdUserData);
  } else {
    setUser(null);
  }
});
```

### 로그인 후 라우팅

`middleware.ts`가 인증 상태에 따라 자동으로 처리합니다. 로그인 버튼 핸들러에서 직접 `router.push()`를 호출하지 않습니다.

| 조건 | middleware 동작 |
| --- | --- |
| `coupleId === null` | `/onboarding`으로 리다이렉트 |
| `coupleId !== null` | `/` 유지 (대시보드 표시) |

---

## E2E 테스트 시나리오

| 시나리오 | 검증 항목 |
| --- | --- |
| 비로그인 상태로 `/` 접근 | 랜딩 페이지와 "구글로 시작하기" 버튼 표시 |
| "구글로 시작하기" 클릭 | 버튼 비활성화 + 로딩 상태 표시 |
| 신규 유저 로그인 성공 | `/onboarding`으로 이동, Firestore에 users 문서 생성 확인 |
| 기존 유저(커플 미연결) 로그인 | `/onboarding`으로 이동 |
| 기존 유저(커플 연결 완료) 로그인 | `/`(대시보드)에 유지 |
| 로그인 팝업 닫기 | 에러 표시 없이 버튼 재활성화 |
| 네트워크 오류 시 | 에러 메시지 표시, 버튼 재활성화 |

---

## 관련 문서

- 인증 플로우 기술 상세: `04-auth-flow.md`
- 온보딩 (커플 연결): `pages/01-onboarding.md`
- 대시보드 (로그인 후 홈): `pages/02-dashboard.md`
- User 타입 및 Firestore 스키마: `03-domain-models.md`
