# 페이지 명세: 가계부 입력 요청 "콕 찌르기" (Nudge)

## 목적

커플 한쪽이 상대에게 **가계부 입력을 요청**할 수 있게 한다. "오늘 쓴 거 입력해줘" 같은 가벼운 콕 찌르기(nudge)를 보내면 상대는 **FCM 푸시**로 받아 탭 한 번에 가계부 입력 화면으로 들어온다. 상대가 앱 미설치/푸시 거부 상태여도 도달할 수 있도록 **카카오톡 공유(Share)** 를 폴백으로 둔다(Phase 2).

본 문서는 기존 알림 시스템(`cashbook-notifications.md`, 예산 경고)과 발송 인프라를 공유하되, "요청" 성격의 넛지를 별도 사이클로 다룬다.

---

## 사용자 스토리

- 커플로서, 상대가 며칠째 가계부를 안 써서 콕 찔러 입력을 부탁하고 싶다.
- 커플로서, 알림을 탭하면 곧바로 입력 화면으로 들어가고 싶다.
- 커플로서, 이미 보낸 요청에 답이 없는데 계속 찌르는 스팸은 막고 싶다.
- 커플로서, 입력 요청 알림이 부담스러우면 설정에서 끄고 싶다.

---

## 채널 & 범위 (Phase 구분)

| Phase | 채널 | 상태 |
|------|------|------|
| **Phase 1 (본 사이클)** | FCM 푸시 | 기존 발송/딥링크 인프라 재사용 |
| **Phase 2 (후속)** | 카카오톡 공유(Share SDK) | 앱 미설치 파트너 폴백. 별도 명세 |

> **완료 회신 푸시**("상대가 입력을 끝냈어요")는 v1 제외 — 후속 사이클.

---

## 넛지 컨셉

- 마스코트(기니피그 커플) 톤의 가벼운 요청. "콕 찌르기 🐹".
- 프리셋 문구 중 택1 또는 커스텀 한 줄 입력.

**프리셋(초안)**
- "오늘 쓴 거 입력해줘"
- "이번 주 가계부 정리하자"
- "카드값 기록 부탁해"

---

## 데이터 모델

### Nudge (신규)

```ts
type NudgeType = 'record-request';
type NudgeStatus = 'pending' | 'seen' | 'done' | 'dismissed';

type Nudge = {
  id: string;
  coupleId: string;
  fromUid: string;              // 보낸 사람
  toUid: string;               // 받는 사람 (파트너)
  type: NudgeType;
  message: string;             // 프리셋 or 커스텀 (빈 문자열 허용)
  status: NudgeStatus;
  createdAt: Timestamp;
  respondedAt: Timestamp | null;
};
```

**Firestore 경로**: `couples/{coupleId}/nudges/{nudgeId}`

### NotificationSettings 확장

`recordRequest` opt-out 필드를 추가한다(기존 유저 호환 위해 optional, 미지정 시 `true` 취급).

```ts
recordRequest?: {
  enabled: boolean;
};
```

**Firestore 경로**: `users/{userId}/settings/notifications` (기존과 동일)

---

## 쿨다운(스팸 방지) 정책

- **시간 기반 쿨다운(30분).** 파트너에게 **마지막으로 보낸** nudge가 30분 이내이면 새 요청을 보낼 수 없다.
  - 상대의 응답 여부(`status`)가 아니라 **마지막 발송 시각**으로 판단한다. 상대가 푸시를 못 받거나 응답하지 못해도 30분이 지나면 다시 보낼 수 있다. (이전의 "미응답 pending 1건 허용" 방식은 응답 전이가 구현되지 않아 한 번 보내면 영구 잠기는 문제가 있었다.)
- 클라이언트: 발송 전 `getLatestNudgeForPartner()`로 마지막 넛지를 조회 → `createdAt`이 쿨다운 이내이면 버튼 비활성 + "약 N분 후 다시 보낼 수 있어요" 안내.
- 서버(Cloud Function): 발송 시점에 동일 (from→to) 넛지가 쿨다운 이내에 이미 있었는지 재확인하여 중복 push를 방지(레이스 방지 이중 가드).
- 쿨다운 상수(`NUDGE_COOLDOWN_MS = 30분`)는 `apps/web/src/services/nudge.ts`와 `functions/src/notifications/nudgeAlert.ts`에 동일값으로 둔다.
- 쿼리에 복합 인덱스 필요: `nudges (fromUid ASC, toUid ASC, createdAt DESC)` (`firestore.indexes.json`).

---

## UI 구성

### 1. 진입점 — 대시보드 "콕 찌르기" 버튼

- 위치: 가계부 대시보드(`/inner/cashbook`).
- 파트너가 연결돼 있을 때만 노출(커플 멤버 2명).
- 클릭 시 overlay-kit 바텀시트(`NudgeSheet`)를 연다.

### 2. NudgeSheet (바텀시트)

```
┌──────────────────────────────┐
│  ○○님에게 입력 요청 보내기        │
│                              │
│  [ 오늘 쓴 거 입력해줘        ● ] │  ← RadioGroup 프리셋
│  [ 이번 주 가계부 정리하자    ○ ] │
│  [ 카드값 기록 부탁해        ○ ] │
│  [ 직접 입력                ○ ] │
│    └ (Textarea, 직접 입력 시)    │
│                              │
│  [        콕 찌르기         ]   │  ← pending 시 disabled
└──────────────────────────────┘
```

- 프리셋 선택 또는 "직접 입력" 선택 시 Textarea 노출.
- 이미 pending 요청이 있으면 버튼 비활성 + 안내 문구.
- 발송 성공 시 시트 닫고 토스트("입력 요청을 보냈어요").

### 3. 알림 설정 — "입력 요청 알림" 토글

- 기존 `NotificationSettingsForm`에 섹션 추가.
- `recordRequest.enabled = false`이면 푸시·인앱 토스트 모두 발송/표시하지 않음.

### 4. 수신 측 경험

- **백그라운드/종료**: FCM 푸시 → 탭 → `data.click_action` 경로로 **가계부 입력(빠른 추가) 화면 직행**.
  - 모바일은 기존 `use-fcm-registration.ts` + `app-webview.tsx`가 `click_action`을 그대로 처리(무수정).
- **포그라운드**: 기존 `foreground-toast.ts` 재사용. nudge는 파트너 발신이므로 경고 스타일 토스트 + [보기] 액션.

---

## 푸시 알림 (FCM)

### 발송 조건

`couples/{coupleId}/nudges/{nudgeId}` 문서가 생성될 때 Cloud Function이 트리거되어 평가한다.

- 수신자는 `toUid`(파트너)뿐. 작성자 본인에게는 보내지 않는다.
- 수신자의 `NotificationSettings.recordRequest.enabled !== false`인 경우에만 발송.
- 서버에서 pending 중복을 재확인(레이스 방지).

### 푸시 메시지 형식

| 필드 | 값 |
|------|-----|
| title | `UANDI 가계부` |
| body | `○○님이 가계부 입력을 요청했어요 🐹` (message가 있으면 그 문구 사용) |
| data.click_action | 가계부 입력(빠른 추가) 경로 |
| data.type | `record-request` |
| data.nudgeId | 문서 id |

### 푸시 클릭 시 동작

- 가계부 입력 화면으로 이동. (정확한 quick-add 경로는 구현 시 확정, 미확정 시 `/inner/cashbook`)

---

## Firestore 보안 규칙

```
couples/{coupleId}/nudges/{nudgeId}
  read:   커플 멤버
  create: 커플 멤버 & fromUid == auth.uid & toUid != fromUid
          & type == 'record-request' & status == 'pending'
  update: 커플 멤버 & 변경 키를 status/respondedAt로만 한정
  delete: 금지
```

> 쿨다운(pending 1건)은 rules로 강제하지 않고 클라이언트 가드 + 서버 재확인으로 처리한다.

---

## 구현 위치

### 클라이언트 (apps/web)
- `src/types/index.ts` — `Nudge` 타입 + `NotificationSettings.recordRequest`
- `src/services/nudge.ts` — `sendNudge()`, `getPendingNudgeForPartner()`
- `src/services/notification-settings.ts` — `recordRequest` 필드 반영
- `src/hooks/useSendNudge.ts` — mutation + pending 조회
- `src/components/cashbook/NudgeButton.tsx` / `NudgeSheet.tsx`
- `src/components/cashbook/NotificationSettingsForm.tsx` — 토글 추가
- `src/lib/fcm/foreground-toast.ts` — nudge 케이스 분기

### 프레젠테이션 (packages/ui)
- `src/custom/inner/NudgeComposer.tsx` (+ 스토리) — 프리셋/커스텀 UI (도메인 디커플)

### Cloud Functions
- `functions/src/notifications/nudgeAlert.ts` — `nudges/{nudgeId}` onCreate 트리거
- `functions/src/index.ts` — export 추가

---

## 관련 문서

- 예산 경고 알림: `cashbook-notifications.md` (발송/딥링크/토스트 인프라 원본)
- 도메인 모델: `docs/03-domain-models.md` (Nudge 스키마·보안 규칙)

---

## 후속 사이클 (이번 작업 제외)

- **Phase 2 카카오 공유**: Kakao JS SDK + 앱키 + RN WebView scheme 인터셉트(`kakaotalk://`/`intent://`)
- **완료 회신 푸시**: 파트너가 입력 완료 시(`status: 'done'`) 보낸 사람에게 회신
- **넛지 인박스**: 받은/보낸 요청 히스토리 목록
