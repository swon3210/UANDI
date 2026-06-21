# 마스코트 스티커/이모티콘 생성 프롬프트

UANDI 마스코트(기니피그 커플)를 **블로그·브랜딩 자산**으로 추가 제작할 때 쓰는 프롬프트 모음.
캐릭터 디자인·생성 워크플로우 기준점은 옆 파일 [`README.md`](./README.md).

## 용도 가이드 (중요)

블로그 **본문에 감정 비트마다 인라인으로 끼우는 용도가 아니다**(산만함 → 의도적으로 제거함).
아래 **구조·브랜딩 자산**으로만 쓴다:

- **카테고리별 커버** (tech-how / product-how / tech-decision / product-decision / essay)
- **OG/공유 카드** (SNS 식별성)
- **글 마무리 사인오프** 1장 (본문 끝에만)
- **상태 화면**(404·empty·loading) 보강

> 카카오톡 정식 이모티콘 셋은 별개 프로젝트(포즈 24종+·움짤·심사). 지금은 위 자산부터.

## 일관성 원칙

1. **레퍼런스 동봉**: 가능하면 `mascot-coral-master.png`(또는 sage)를 이미지 입력으로 같이 넣어 "match this character exactly". Gemini는 이미지 입력 지원.
2. **시트로 한 번에**: 새 표정/포즈는 기존 `mascot-stickers-master.png`처럼 여러 개를 한 시트에 뽑아야 톤이 같이 잠긴다.
3. 모든 프롬프트는 아래 **STYLE LOCK**을 그대로 앞에 붙이고 `POSE/EXPRESSION`만 교체.

---

## 0. STYLE LOCK (모든 프롬프트 앞에 그대로)

영문이 이미지 모델 아트 디렉션에 더 안정적이라 영문으로 잠근다.

```
STYLE LOCK — reuse verbatim for every mascot asset, change only the POSE/EXPRESSION line.

Character: a single chubby, round guinea pig in a soft Korean kawaii sticker (이모티콘) style.
Body: plump egg-shaped body, no visible neck, tiny stubby feet, soft rounded ears.
Fur: flat two-tone — cream / off-white face, belly and lower body; light caramel-tan
  patches on the top of the head, the ears, and the back. Colors are flat, no texture.
Face: large round solid dark-brown eyes with one tiny white glint; small inverted-triangle
  pink nose; gentle soft mouth; round soft-pink oval cheek blush on both cheeks.
Line: clean, uniform, medium-thick WARM DARK-BROWN outline (not pure black), smooth vector edges.
Shading: minimal flat cel shading only — slightly lighter belly, one soft shadow under the body.
  No gradients, no realistic rendering, no fur strands.
Scarf: a chunky knit scarf wrapped once around the neck with a short hanging tail.
  Use CORAL/SALMON (#E8837A) for the primary character. [or: SAGE GREEN (#6FAE8E) for the partner]
Finish: classic die-cut sticker — a clean solid WHITE border hugging the silhouette + faint drop shadow.
Composition: full body, centered, facing viewer (front or slight 3/4), generous even margin,
  one character only, NO text, NO background scenery unless the pose line says so.
Background: fully transparent.
Palette lock: fur cream ~#FBEFD9, tan ~#D8A86B, outline ~#5B3A29, blush ~#F4A8A0,
  coral scarf #E8837A, sage scarf #6FAE8E. Keep these exact and consistent across all stickers.

POSE/EXPRESSION: <여기만 교체>
```

> 짝꿍(세이지) 버전은 Scarf 줄을 sage로 바꾸고 POSE에 "sage-green scarf guinea pig" 명시.

---

## 1. Tier A — 블로그 실사용 (지금 추천)

### 1-1. 카테고리 커버 5종 (한 시트로)

```
[STYLE LOCK 붙이고]
Make a 5-up contact sheet, same character and style in all five, evenly spaced, transparent bg:
1) tech-how    — coral guinea pig sitting at a tiny laptop, paws typing, focused happy face.
2) product-how — coral + sage guinea pigs side by side looking at one smartphone together.
3) tech-decision — coral guinea pig in front of a small whiteboard, one paw on chin, two
   thought-arrows splitting (choosing between options), thoughtful look.
4) product-decision — coral guinea pig with a small glowing lightbulb above its head,
   "aha" surprised-delight face (learning from a user).
5) essay — coral guinea pig holding a warm tea mug, eyes softly closed, relaxed/reflective.
```

### 1-2. 글 마무리 사인오프 (단일)

```
[STYLE LOCK] POSE/EXPRESSION: coral guinea pig waving one paw with a warm closed-eye smile,
a small heart floating near the paw. "thank you for reading" vibe. No text.
```

### 1-3. OG / 공유 히어로 (커플, 텍스트는 코드로 합성)

```
[STYLE LOCK, two characters allowed] POSE: coral-scarf and sage-scarf guinea pigs standing
together, both giving a cheerful thumbs-up (paw up), holding a blank rounded signboard between
them (leave it EMPTY — text added later in code). Wide composition, transparent bg.
```

---

## 2. Tier B — 표정/이모티콘 확장 (옵션)

기존 5종(neutral·surprised·teary·laugh·wink)에 더할 표정. 시트로 뽑는다.

```
[STYLE LOCK] 8-up sheet, identical character/style, coral scarf, transparent bg:
1) love      — heart-shaped eyes, blissful smile, tiny hearts floating.
2) sleepy    — eyes closed, small "Zzz", droopy relaxed posture.
3) thinking  — one paw on chin, a "?" mark, eyes glancing up.
4) celebrate — both paws thrown up in a cheer, confetti specks, wide open happy mouth.
5) sob       — big teary waterfall eyes, mouth turned down (stronger than the existing teary).
6) pout      — puffed cheeks, small frown, tiny anger "puff" mark (sulking, cute).
7) proud     — confident closed-eye smile, one paw on chest / thumbs-up.
8) shy       — both paws over reddened cheeks, bashful peeking eyes.
```

커플(듀오) 변형: 하이파이브 / 둘 사이 큰 하트 / 등 맞대고 토라짐 / 손잡고 걷기 —
각각 한 줄로 `STYLE LOCK(two characters)` 뒤에 붙인다.

---

## 3. 생성·후처리 체크리스트

1. **레퍼런스 동봉**: `mascot-coral-master.png`(또는 sage)를 이미지 입력으로 같이 넣어 "match this character exactly".
2. **크게 생성**: 단일 캐릭터 네이티브 한계 ~505×600(README). 시트는 1408×768 이상으로 뽑아 영역별 해상도 확보.
3. **배경 제거 필수** (Gemini 가짜 투명 = 회색 체커보드):
   ```bash
   node .context/mascot-bg-remove.js <원본.png> assets/mascot/<name>-master.png 4096 rgba
   ```
4. **시트 분할** 후 표정별 개별 PNG → 블로그용 최적화본은 `apps/blog/public/mascot/`에 다운사이즈(커버 폭 ~440px·레티나 2x면 충분).
5. **흰 테두리·라인 두께**가 기존과 같은지 1:1 대조(가장 티 나는 일관성 포인트).
