---
title: 'UANDI 프로젝트를 시작하며'
date: '2026-03-19'
summary: '신혼부부를 위한 사진 + 가계부 앱, UANDI의 첫 발을 내딛다.'
tags: ['project', 'kickoff']
---

## 왜 이 서비스를 만들까

결혼 후 아내와 함께 사진을 정리하고, 가계부를 쓰는 일이 생각보다 번거로웠다.
사진은 카카오톡 대화방에 흩어져 있고, 가계부는 엑셀 시트 하나에 의지하고 있었다.

둘만의 공간에서 사진을 폴더별로 정리하고, 돈 관리를 함께 할 수 있는 서비스가 있으면 좋겠다고 생각했다.

## 기술 선택

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Firebase** (Auth, Firestore, Storage) — 빠르게 MVP를 만들기에 적합
- **TailwindCSS 4** + **shadcn/ui** — 디자인 시스템을 빠르게 구축
- **Turborepo** — 모노레포로 web, docs, ui 패키지를 한 곳에서 관리

## 다음 단계

먼저 Google OAuth로 로그인하고, 커플 초대 코드로 두 사람을 연결하는 온보딩 플로우를 만들 예정이다.
