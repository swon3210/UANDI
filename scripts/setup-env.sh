#!/bin/sh
# Conductor worktree 지원: .env.local 심볼릭 링크 자동 생성
# 사용법: sh scripts/setup-env.sh
#
# 새 workspace에서 한 번 실행하면 원본 repo의 .env.local을 심볼릭 링크로 연결합니다.
# CLAUDE.md 에이전트 지침에 따라 자동 실행되도록 설정할 수도 있습니다.

ORIGIN_REPO="/Users/jinsong/Documents/Github/UANDI"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENV_FILE="apps/web/.env.local"
ORIGIN_ENV="$ORIGIN_REPO/$ENV_FILE"
TARGET_ENV="$PROJECT_ROOT/$ENV_FILE"

if [ ! -f "$ORIGIN_ENV" ]; then
  echo "[setup-env] 원본 .env.local을 찾을 수 없습니다: $ORIGIN_ENV"
  exit 1
fi

if [ -e "$TARGET_ENV" ]; then
  echo "[setup-env] .env.local이 이미 존재합니다: $TARGET_ENV"
  exit 0
fi

ln -s "$ORIGIN_ENV" "$TARGET_ENV"
echo "[setup-env] 심볼릭 링크 생성 완료: $TARGET_ENV -> $ORIGIN_ENV"
