# 모바일 빌드 전: origin/main 최신화 + 에셋/네이티브 변경 커밋 필수 (prod·preview·dev 공통)

EAS 빌드는 **모든 프로파일(production / preview / development), 클라우드/로컬 모두**
**git에 커밋된 상태(현재 브랜치 HEAD)를 아카이브해서 빌드한다.**
→ 따라서 빌드 결과는 (1) 어떤 base에서 갈라졌는지, (2) 변경이 커밋됐는지에 100% 의존한다.

## 빌드 전 체크리스트 (반드시)

1. **브랜치가 origin/main 최신과 정합한지 확인.**
   ```bash
   git fetch origin
   git rev-list --left-right --count origin/main...HEAD   # "behind ahead"
   ```
   `behind`가 0이 아니면, 내 브랜치는 옛 base라 **최신 에셋(앱 아이콘/스플래시 등)이 빠진다.**
   먼저 `git rebase origin/main` 또는 origin/main 기준으로 다시 작업한다.
2. **변경된 에셋·네이티브 코드가 모두 커밋됐는지 확인.**
   ```bash
   git status --short apps/mobile   # 출력이 비어 있어야 함
   ```
   `??`(untracked)나 ` M`(modified)이 남아 있으면 먼저 커밋한다.

## 실제 사고 2건

1. **옛 base 빌드**: 작업 브랜치가 origin/main보다 16커밋 뒤처진 지점에서 갈라져,
   빌드에 **옛 꽃/하트 앱 아이콘 + 옛 스플래시**가 들어갔다. main엔 이미 마스코트
   아이콘·스플래시(#188, #196)가 있었는데 빌드엔 반영 안 됨. → 빌드 전 `behind` 확인으로 예방.
2. **미커밋 누락**: 스플래시/`FloatingBubbleModule.kt`를 고쳤지만 커밋 안 한 채 빌드 →
   git 아카이브에 옛 상태가 들어가 "고친 게 반영 안 된" APK. 단서는 빌드 로그의
   `... is not checked in to your repository and won't be uploaded to the builder` 경고.

## 에셋 단일 소스 원칙

- 앱 아이콘/스플래시 등 **생성 산출물은 repo에 커밋된 최종 PNG가 단일 소스**다.
  (`.context/moa-assets/...` 디자인 소스는 git에 없어 클라우드 빌드에서 재생성 불가
   → 생성 스크립트 실행 후 **산출물 PNG를 반드시 커밋**해야 빌드에 반영된다.)
- 스플래시는 안드로이드 12+ 원형 마스킹 때문에 `scripts/make-circle-safe-splash.mjs`로
  중앙 원 안에 들어가게 가공한 산출물을 커밋한다. 풀블리드 원본은
  `scripts/splash-native.fullbleed.png`에 보관.

## 설치 검증 시 주의

- preview/dev는 versionCode가 같을 수 있어, 삼성 등 일부 기기는 같은 versionCode면
  **업데이트를 건너뛴다.** 변경 확인은 **기존 앱 삭제 후 클린 설치**로 한다.

## 절대 하지 말 것

- 브랜치 `behind` 확인 없이 빌드 (옛 base → 최신 에셋 누락)
- 에셋/네이티브 변경을 커밋하지 않고 빌드
- `EAS_NO_VCS=1`(로컬 작업트리 빌드) 결과를 보고 "프로덕션도 되겠지" 가정 (프로덕션은 git 커밋만 본다)
