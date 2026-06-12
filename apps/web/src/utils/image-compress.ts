/** 업로드 전 이미지 압축 (1MB 이하, 최대 1920px). 브라우저에서만 동작. */
export async function compressImage(file: File): Promise<File> {
  const imageCompression = (await import('browser-image-compression')).default;
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    initialQuality: 0.85,
    useWebWorker: true,
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 압축 후 data URL과 압축 파일을 함께 반환한다(AI 파싱 입력용). */
export async function compressAndEncode(file: File): Promise<{ dataUrl: string; file: File }> {
  const compressed = await compressImage(file);
  return { dataUrl: await readFileAsDataUrl(compressed), file: compressed };
}
