# 인증 & 커플 연결 플로우

## 인증 방식

- **Firebase Authentication** — Google OAuth + Apple 소셜 로그인 지원
  - Apple 로그인은 App Store 심사 가이드라인 4.8(제3자 소셜 로그인 제공 시 필수) 대응.
    Firebase Console에서 Apple provider 활성화 + Apple Developer의 Service ID/Key 설정이 선행돼야 한다.
- 이메일/비밀번호 로그인은 MVP에서 제외

---

## 상태 분류

앱 진입 시 사용자는 아래 3가지 상태 중 하나입니다.

| 상태                        | 조건                               | 이동 대상       |
| --------------------------- | ---------------------------------- | --------------- |
| `unauthenticated`           | Firebase 세션 없음                 | `/` 랜딩 페이지 |
| `authenticated_no_couple`   | 로그인 O, `user.coupleId === null` | `/onboarding`   |
| `authenticated_with_couple` | 로그인 O, `user.coupleId !== null` | `/` (대시보드)  |

> `authenticated_with_couple`은 **커플 연결 완료(2명)** 를 뜻하지 않는다. 커플 공간을 만든 순간 `coupleId`가 박히므로, 혼자인 상태(memberUids 1명)로도 대시보드에 들어갈 수 있다. 상대가 아직 없을 때의 안내(초대 카드)는 `pages/02-dashboard.md` 참고.

---

## 플로우 다이어그램

```
앱 진입
  │
  ├─ [세션 없음] ──────────────────→ 랜딩 페이지
  │                                   └─ "Google로 시작하기" 클릭
  │                                       └─ Firebase Google 로그인
  │                                           ├─ 신규 유저: users/{uid} 문서 생성
  │                                           └─ 기존 유저: 그대로
  │
  ├─ [로그인 O, coupleId 없음] ────→ /onboarding
  │                                   ├─ [새 커플 만들기]
  │                                   │   └─ couples/{coupleId} 생성
  │                                   │       ├─ memberUids: [uid]
  │                                   │       ├─ 기본 카테고리 초기화 (cashbookCategories, DEFAULT_CATEGORIES)
  │                                   │       └─ inviteCode 생성 (6자리)
  │                                   │           └─ user.coupleId 업데이트
  │                                   │               └─ 초대 코드 화면 표시
  │                                   │                   ├─ [먼저 시작하기] → / (대시보드, 초대 카드 노출)
  │                                   │                   └─ 상대 합류 감지 → 연결 완료 화면 → [시작하기] → /
  │                                   │
  │                                   └─ [초대 코드 입력]
  │                                       └─ inviteCode로 couples 조회
  │                                           ├─ 유효하지 않음: 에러 메시지
  │                                           ├─ 만료됨: 에러 메시지
  │                                           ├─ 이미 2명: 에러 메시지
  │                                           └─ 성공:
  │                                               ├─ couple.memberUids에 uid 추가
  │                                               └─ user.coupleId 업데이트
  │                                                   └─ 연결 완료 화면 → [시작하기] → / (대시보드)
  │
  ├─ [초대 링크 /invite/{code}] ────→ 코드를 localStorage(`uandi:pendingInviteCode`)에 저장 후
  │                                   ├─ 세션 없음 → / (랜딩에 "초대 링크로 들어왔어요" 배너)
  │                                   │     └─ 로그인 → /onboarding → 코드 입력 화면이 코드가 채워진 채 바로 열림
  │                                   ├─ coupleId 없음 → /onboarding (위와 동일)
  │                                   └─ coupleId 있음 → / (코드 무시, 저장값 삭제)
  │
  └─ [로그인 O, coupleId 있음] ────→ / (대시보드)
```

---

## 구현 명세

### `lib/firebase/auth.ts`

```ts
// 제공해야 할 함수들
signInWithGoogle(): Promise<void>
signInWithApple(): Promise<void>
signOut(): Promise<void>
onAuthStateChanged(callback): Unsubscribe
```

### `lib/firebase/firestore.ts` — Firestore 인터페이스

Firestore SDK 인스턴스와 타입화된 컬렉션 레퍼런스만 노출합니다.
서비스 도메인 로직은 포함하지 않습니다.

```ts
// Firestore 인스턴스
export const db: Firestore;

// 타입화된 컬렉션 레퍼런스 헬퍼
export const usersCol: CollectionReference<User>;
export const couplesCol: CollectionReference<Couple>;
```

### `services/user.ts` — 유저 서비스

```ts
createUserDocument(uid: string, data: Omit<User, 'uid'>): Promise<void>
getUserDocument(uid: string): Promise<User | null>
```

### `services/couple.ts` — 커플 서비스

```ts
createCouple(uid: string, displayName: string): Promise<{ coupleId: string; inviteCode: string }>
  // couples 문서 → 기본 카테고리 초기화(initDefaultCategories) → 초대 코드 발급 → user.coupleId
joinCoupleByInviteCode(uid: string, code: string): Promise<{ coupleId: string }>  // 실패 시 throw
previewInviteCode(code: string): Promise<{ inviterName: string | null } | null>  // 합류 전 미리보기(null = 없음/만료/만석)
ensureActiveInviteCode(coupleId: string, uid: string, displayName: string): Promise<string>
  // couple.inviteCode가 유효하면 그대로, 없거나 만료·소진됐으면 새로 발급해 couple에 기록
buildInviteLink(code: string): string   // `${origin}/invite/${code}`
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

| 경로                               | 비로그인                 | coupleId 없음                |
| ---------------------------------- | ------------------------ | ---------------------------- |
| `/`                                | `/`으로 유지 (랜딩 표시) | `/onboarding`으로 리다이렉트 |
| `/onboarding`                      | `/`으로 리다이렉트       | 허용                         |
| `/inner/photos`, `/inner/cashbook` | `/`으로 리다이렉트       | `/onboarding`으로 리다이렉트 |

---

## 초대 코드 생성 규칙

- 6자리 대문자 영숫자 (`[A-Z0-9]{6}`)
- 저장 위치는 `inviteCodes/{code}` 최상위 인덱스. 코드 자체가 문서 id.
  - 신규 유저(아직 어떤 couple 멤버도 아님)는 `couples/*` read 권한이 없으므로 couple을 직접 쿼리할 수 없다. 인덱스를 통해 코드 → coupleId만 한 건씩 `get`으로 조회.
  - 중복 체크는 `getDoc(inviteCodes/{candidate})` 한 번으로 처리 (전체 `couples` 컬렉션 스캔 금지).
- 유효 기간: 생성 후 **48시간** (`expiresAt`)
- `consumedBy`로 합류 완료 표시. 합류 시 클라이언트가 `null → 본인 uid`로 한 번 update하고, 이후 couple `memberUids`에 본인 추가.
- 커플 연결 완료 후 `inviteCodes/{code}` 문서는 기록 목적으로 유지 (createdBy만 삭제 가능)
- 생성 시 `createdByName`(생성자 표시 이름)을 함께 저장한다. 합류 전 상대는 `users/*`를 읽을 수 없으므로, 코드 입력 화면의 "OO님의 초대예요" 미리보기는 이 값을 쓴다.
- 현재 유효한 코드는 `couples/{coupleId}.inviteCode`에도 기록한다. 대시보드 초대 카드가 코드를 다시 보여줄 때 이 값을 읽고, 만료·소진됐으면 `ensureActiveInviteCode`가 새 코드를 발급한다.
- 초대 링크는 `/invite/{code}`. 링크로 진입하면 코드를 저장해 두고 로그인 뒤 코드 입력 화면을 자동으로 연다.

## 회원탈퇴 위치

- 회원탈퇴 버튼(`delete-account-button`)은 **프로필 편집 페이지(`/settings/profile`) 맨 아래**에 둔다. 설정 첫 화면(`/settings`)에는 두지 않는다(2026-11 걷기: 첫 주 사용자가 설정에 들어가자마자 빨간 "회원탈퇴"를 보는 건 어색하다).
- 확인 다이얼로그(`delete-account-dialog`)·탈퇴 후 랜딩 리다이렉트·커플 데이터 보존 규칙은 그대로다.
