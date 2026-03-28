---
description: 코드 변경 후 반드시 TypeScript 타입체크를 수행한다.
globs: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx"]
---

# 코드 변경 후 타입체크 필수

`.ts` / `.tsx` 파일을 수정하거나 새로 작성한 뒤에는 **반드시** 타입체크를 실행한다.

```bash
pnpm --filter web exec tsc --noEmit
```

타입 에러가 있으면 모두 수정한 뒤에 작업 완료로 간주한다.
