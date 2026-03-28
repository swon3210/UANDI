#!/bin/sh
# Conductor worktree 지원: .env.local 심볼릭 링크 자동 생성
# 사용법: sh scripts/setup-env.sh
#
# 새 workspace에서 한 번 실행하면 원본 repo의 .env.local을 심볼릭 링크로 연결합니다.
# CLAUDE.md 에이전트 지침에 따라 자동 실행되도록 설정할 수도 있습니다.

ORIGIN_REPO="/Users/jinsong/Documents/Github/UANDI"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENV_FILES="apps/web/.env.local apps/mobile/.env"

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
