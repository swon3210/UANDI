// 안드로이드 12+ 네이티브 스플래시는 중앙 이미지를 원형으로 마스킹한다.
// 가로로 넓은 마스코트 일러스트는 양옆/모서리가 잘리므로, 투명 배경 일러스트를
// 중앙 원 안에 들어가도록 축소해 "잘림이 안 보이는" 스플래시를 만든다.
//
// 소스: scripts/splash-native.fullbleed.png (origin/main 의 풀블리드 일러스트, 투명 배경)
// 출력: assets/images/splash-native.png (app.json expo-splash-screen 이 참조)
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, 'splash-native.fullbleed.png');
const OUT = path.join(__dirname, '..', 'assets', 'images', 'splash-native.png');

const SIZE = 1024;
// 콘텐츠 전체(바운딩 박스)가 들어갈 중앙 원의 지름 비율.
// 안드로이드 마스킹 원(~66%)보다 안쪽이라 어떤 기기에서도 잘리지 않는다.
const CONTENT_CIRCLE = 0.62;

// 1) 투명 여백 제거(트림) → 실제 콘텐츠 바운딩 박스만 남김
const trimmed = await sharp(SRC).trim().toBuffer();
const { width: tw, height: th } = await sharp(trimmed).metadata();

// 2) 콘텐츠 대각선이 목표 원 지름 이하가 되도록 축소(전체가 원 안에 들어가도록)
const targetD = SIZE * CONTENT_CIRCLE;
const diag = Math.sqrt(tw * tw + th * th);
const scale = targetD / diag;
const rw = Math.max(1, Math.round(tw * scale));
const rh = Math.max(1, Math.round(th * scale));
const resized = await sharp(trimmed).resize(rw, rh, { fit: 'fill' }).toBuffer();

// 3) 정사각 투명 캔버스 중앙에 배치(배경색은 app.json 의 backgroundColor 가 채움)
await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: resized, gravity: 'center' }])
  .png()
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`생성 완료: ${OUT} (${meta.width}x${meta.height}), 콘텐츠 ${rw}x${rh} (원 지름 ${Math.round(targetD)})`);
