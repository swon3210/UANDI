import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  // 워크스페이스 패키지(cashbook-core)는 번들에 포함한다. 나머지는 node_modules에서 로드.
  noExternal: ['@uandi/cashbook-core'],
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  // 원칙 문서는 번들에 넣지 않고 dist/ 옆에 복사한다. 코드는 import.meta.url 기준으로 읽으므로
  // src(tsx·vitest)·dist(배포) 어디서 실행해도 같은 상대 경로가 맞는다.
  onSuccess:
    "node -e \"require('fs').copyFileSync('src/resources/principles.ko.md', 'dist/principles.ko.md')\"",
});
