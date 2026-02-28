# 인증 & 커플 연결 플로우

## 인증 방식

- **Firebase Authentication** — Google OAuth 소셜 로그인만 지원
- 이메일/비밀번호 로그인은 MVP에서 제외

---

## 상태 분류

앱 진입 시 사용자는 아래 3가지 상태 중 하나입니다.

| 상태                        | 조건                               | 이동 대상       |
| --------------------------- | ---------------------------------- | --------------- |
| `unauthenticated`           | Firebase 세션 없음                 | `/` 랜딩 페이지 |
| `authenticated_no_couple`   | 로그인 O, `user.coupleId === null` | `/onboarding`   |
| `authenticated_with_couple` | 로그인 O, `user.coupleId !== null` | `/` (대시보드)  |

---

## 플로우 다이어그램

```
앱 진입
  │
  ├─ [세션 없음] ──────────────────→ 랜딩 페이지
  │                                   └─ "구글로 시작하기" 클릭
  │                                       └─ Firebase Google 로그인
  │                                           ├─ 신규 유저: users/{uid} 문서 생성
  │                                           └─ 기존 유저: 그대로
  │
  ├─ [로그인 O, coupleId 없음] ────→ /onboarding
  │                                   ├─ [새 커플 만들기]
  │                                   │   └─ couples/{coupleId} 생성
  │                                   │       ├─ memberUids: [uid]
  │                                   │       └─ inviteCode 생성 (6자리)
  │                                   │           └─ user.coupleId 업데이트
  │                                   │               └─ 초대 코드 화면 표시
  │                                   │
  │                                   └─ [초대 코드 입력]
  │                                       └─ inviteCode로 couples 조회
  │                                           ├─ 유효하지 않음: 에러 메시지
  │                                           ├─ 만료됨: 에러 메시지
  │                                           ├─ 이미 2명: 에러 메시지
  │                                           └─ 성공:
  │                                               ├─ couple.memberUids에 uid 추가
  │                                               └─ user.coupleId 업데이트
  │                                                   └─ /으로 이동 (대시보드)
  │
  └─ [로그인 O, coupleId 있음] ────→ / (대시보드)
```

---

## 구현 명세

### `lib/firebase/auth.ts`

```ts
// 제공해야 할 함수들
signInWithGoogle(): Promise<void>
signOut(): Promise<void>
onAuthStateChanged(callback): Unsubscribe
```

### `lib/firebase/firestore.ts` — Firestore 인터페이스

Firestore SDK 인스턴스와 타입화된 컬렉션 레퍼런스만 노출합니다.
서비스 도메인 로직은 포함하지 않습니다.

```ts
// Firebase 지연 초기화를 위해 함수 형태로 제공
export const getDb: () => Firestore;

// 타입화된 컬렉션 레퍼런스 헬퍼
export const getUsersCol: () => CollectionReference<User>;
export const getCouplesCol: () => CollectionReference<Couple>;
```

### `services/user.ts` — 유저 서비스

```ts
// createdAt은 함수 내부에서 serverTimestamp()로 주입
createUserDocument(uid: string, data: Omit<User, 'uid' | 'createdAt'>): Promise<void>
getUserDocument(uid: string): Promise<User | null>
```

### `services/couple.ts` — 커플 서비스

```ts
createCouple(uid: string): Promise<{ coupleId: string; inviteCode: string }>
joinCoupleByInviteCode(uid: string, code: string): Promise<void>  // 실패 시 throw
```

### `stores/auth.store.ts` (Jotai)

```ts
// 원시 atom
// undefined = 로딩 중, null = 비로그인, User = 로그인됨
const userAtom = atom<User | null | undefined>(undefined);

// 파생 atom (읽기 전용)
const authStatusAtom = atom<
  'loading' | 'unauthenticated' | 'authenticated_no_couple' | 'authenticated_with_couple'
>((get) => {
  const user = get(userAtom);
  if (user === undefined) return 'loading';
  if (user === null) return 'unauthenticated';
  if (user.coupleId === null) return 'authenticated_no_couple';
  return 'authenticated_with_couple';
});
```

---

## 라우트 보호

Next.js App Router의 `middleware.ts`에서 처리합니다.

| 경로                   | 비로그인                 | coupleId 없음                |
| ---------------------- | ------------------------ | ---------------------------- |
| `/`                    | `/`으로 유지 (랜딩 표시) | `/onboarding`으로 리다이렉트 |
| `/onboarding`          | `/`으로 리다이렉트       | 허용                         |
| `/photos`, `/cashbook` | `/`으로 리다이렉트       | `/onboarding`으로 리다이렉트 |

### `uandi-auth` 쿠키 메커니즘

Firebase Client SDK는 Edge Runtime(middleware)에서 동작하지 않으므로, **`AuthInit` 컴포넌트가 `userAtom` 변경을 감지해 `uandi-auth` 쿠키를 설정**하고, middleware는 이 쿠키를 읽어 리다이렉트를 결정합니다.

| 쿠키 값 | 의미 |
| --- | --- |
| `with_couple` | 로그인 + `coupleId !== null` |
| `no_couple` | 로그인 + `coupleId === null` |
| (없음) | 미인증 또는 첫 방문 — middleware가 통과시키고 클라이언트가 처리 |

쿠키는 `AuthInit`의 `userAtom` 구독 `useEffect`에서 갱신됩니다. 온보딩 완료 등 어디서든 `setUser()`를 호출하면 자동으로 쿠키가 동기화됩니다.

```ts
// components/AuthInit.tsx 내부
useEffect(() => {
  if (user === undefined) return;
  if (user === null) clearCookie();
  else setCookie(user.coupleId !== null ? 'with_couple' : 'no_couple');
}, [user]);
```

---

## 초대 코드 생성 규칙

- 6자리 대문자 영숫자 (`[A-Z0-9]{6}`)
- 생성 시 Firestore에서 중복 확인 후 유니크하게 저장
- 유효 기간: 생성 후 **48시간**
- 커플 연결 완료 후 `inviteCode`, `inviteCodeExpiresAt` 필드는 유지 (기록 목적)
