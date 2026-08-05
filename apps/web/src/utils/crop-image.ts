// react-easy-crop이 돌려주는 픽셀 영역(자연 이미지 좌표)을 잘라 정사각 이미지 Blob으로 만든다.
// 브라우저에서만 동작(canvas 사용).

export type CropArea = { x: number; y: number; width: number; height: number };

const OUTPUT_MAX = 512; // 아바타 표시 크기 대비 충분 — 업스케일은 하지 않음

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    img.src = src;
  });
}

export async function getCroppedBlob(imageSrc: string, area: CropArea): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d 컨텍스트를 만들지 못했습니다.');

  const sourceSize = Math.max(1, Math.round(Math.min(area.width, area.height)));
  const outSize = Math.min(OUTPUT_MAX, sourceSize);
  canvas.width = outSize;
  canvas.height = outSize;

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outSize, outSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환에 실패했습니다.'))),
      'image/jpeg',
      0.9
    );
  });
}
