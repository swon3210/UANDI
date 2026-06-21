# 마스코트 마스터 아카이브

UANDI 마스코트(기니피그 커플)의 **소스 마스터** — 배경 제거된 최대 해상도 원본.

| 파일 | 내용 | 해상도 | 비고 |
| --- | --- | --- | --- |
| `mascot-coral-master.png` | 코랄 스카프 단독 | 505×600 RGBA | 우리집/Primary |
| `mascot-sage-master.png` | 세이지(그린) 스카프 단독 | 505×600 RGBA | 짝꿍 |
| `mascot-splash-master.png` | 둘이 가계부 쓰는 장면 | 789×602 RGBA | 스플래시 |
| `mascot-face-master.png` | 코랄 얼굴 버스트 | 865×905 RGBA | 로고/파비콘 |
| `mascot-stickers-master.png` | 표정 5종 스티커 시트 | 1240×685 RGBA | 커뮤니티/분할용 |
| `mascot-app-icon-master.png` | 앱 아이콘(코랄 배경) | 1024×1024 **불투명** | 모바일/PWA 아이콘 |

## 용도

- **이 파일들은 빌드에 포함되지 않는다** (어떤 코드도 import하지 않음). 보관용 아카이브.
- 실제 앱이 쓰는 **최적화본**(palette PNG)은 `packages/ui/src/assets/mascot-*.png` 에 있다 (로더·UI 상태·스플래시·얼굴·스티커·앱아이콘).
- 스플래시·로고·블로그 등 **큰 렌더가 필요하면 이 마스터에서** 새 크기를 뽑는다.

## 생성 방법

Gemini가 생성한 "투명" PNG는 실제론 회색 체커보드가 박힌 불투명 이미지라, 배경을 제거해야 한다.
가장자리 flood-fill + 가장 큰 연결요소만 유지(반짝이 워터마크 제거) 파이프라인으로 처리:

```bash
# <src> <out> [size] [rgba]  — size 크게 + rgba = 네이티브 해상도 풀 RGBA 마스터
node .context/mascot-bg-remove.js <원본.png> assets/mascot/<name>-master.png 4096 rgba
```

> 505×600은 소스(Gemini 1408×768 중 캐릭터 영역)의 네이티브 한계다. 더 큰 해상도가 필요하면
> Gemini에서 더 크게 재생성해야 한다.
