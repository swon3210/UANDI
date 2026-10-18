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
});
