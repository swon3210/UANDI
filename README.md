# UANDI

신혼부부를 위한 프라이빗 공간 — 사진 갤러리 + 가계부

## 기술 스택

Next.js · React · TypeScript · TailwindCSS · Firebase · Turborepo · pnpm

## 문서

이 프로젝트는 문서 주도 개발 방식으로 관리됩니다.
구현 전 반드시 `docs/` 폴더의 문서를 확인하세요.

> **문서 사이트**: 개발 서버 실행 후 `http://localhost:3001` 에서 웹으로 열람 가능합니다.

| 문서                                                             | 내용                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| [docs/00-overview.md](docs/00-overview.md)                       | 프로젝트 비전, 기능 범위                         |
| [docs/01-tech-stack.md](docs/01-tech-stack.md)                   | 기술 스택, 모노레포 구조, 코딩 컨벤션            |
| [docs/02-design-system.md](docs/02-design-system.md)             | shadcn 기반 디자인 시스템                        |
| [docs/03-domain-models.md](docs/03-domain-models.md)             | Firestore 스키마, TypeScript 타입                |
| [docs/04-auth-flow.md](docs/04-auth-flow.md)                     | 인증 & 커플 연결 플로우                          |
| [docs/05-testing-strategy.md](docs/05-testing-strategy.md)       | E2E 테스트 전략 (Playwright + Firebase Emulator) |
| [docs/06-docs-site.md](docs/06-docs-site.md)                     | 문서 사이트 명세                                 |
| [docs/ai-workflow.md](docs/ai-workflow.md)                       | AI 구현 요청 프로토콜                            |
| [docs/pages/01-onboarding.md](docs/pages/01-onboarding.md)       | 온보딩 페이지 명세                               |
| [docs/pages/02-dashboard.md](docs/pages/02-dashboard.md)         | 대시보드 명세                                    |
| [docs/pages/03-photo-gallery.md](docs/pages/03-photo-gallery.md) | 사진 갤러리 명세                                 |
| [docs/pages/04-cashbook.md](docs/pages/04-cashbook.md)           | 가계부 명세                                      |

## 패키지 구성

| 패키지        | 경로          | 포트 |
| ------------- | ------------- | ---- |
| 메인 앱       | `apps/web`    | 3000 |
| 문서 사이트   | `apps/docs`   | 3001 |
| 디자인 시스템 | `packages/ui` | —    |

## 시작하기

```bash
pnpm install

# 전체 개발 서버 실행 (web:3000 + docs:3001)
pnpm dev

# 문서 사이트만 실행
pnpm --filter docs dev

# Firebase 에뮬레이터 실행 (E2E 테스트용)
pnpm emulators

# E2E 테스트 실행
pnpm test:e2e
```
