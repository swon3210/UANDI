#!/bin/sh
# Conductor worktree 지원: .env.local 심볼릭 링크 자동 생성
# 사용법: sh scripts/setup-env.sh
#
# 새 workspace에서 한 번 실행하면 원본 repo의 .env.local을 심볼릭 링크로 연결합니다.
# CLAUDE.md 에이전트 지침에 따라 자동 실행되도록 설정할 수도 있습니다.

ORIGIN_REPO="/Users/jinsong/Documents/Github/UANDI"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 원본 repo에만 두는 비밀/설정 파일들 (모두 gitignore 대상 → 심볼릭 링크로만 연결)
# asc-api-key.p8: App Store Connect API 키 (eas submit --profile production 에서 사용)
# GoogleService-Info.plist: iOS FCM 설정 (@react-native-firebase/messaging). Firebase Console에서 다운로드해 원본 repo에 둔다.
ENV_FILES="apps/web/.env.local apps/mobile/.env apps/mobile/google-services.json apps/mobile/GoogleService-Info.plist apps/mobile/asc-api-key.p8"

for ENV_FILE in $ENV_FILES; do
  ORIGIN_ENV="$ORIGIN_REPO/$ENV_FILE"
  TARGET_ENV="$PROJECT_ROOT/$ENV_FILE"

  if [ ! -f "$ORIGIN_ENV" ]; then
    echo "[setup-env] 원본 파일을 찾을 수 없습니다: $ORIGIN_ENV (건너뜀)"
    continue
  fi

  if [ -e "$TARGET_ENV" ]; then
    echo "[setup-env] 이미 존재합니다: $TARGET_ENV (건너뜀)"
    continue
  fi

  ln -s "$ORIGIN_ENV" "$TARGET_ENV"
  echo "[setup-env] 심볼릭 링크 생성 완료: $TARGET_ENV -> $ORIGIN_ENV"
done
