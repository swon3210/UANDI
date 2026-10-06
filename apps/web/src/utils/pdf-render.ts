import type { PDFDocumentProxy } from 'pdfjs-dist';

/** 렌더링 폭(px). A4를 약 170dpi로 찍는 수준 — 12px 글자도 OCR이 안정적으로 읽는다. */
const DEFAULT_TARGET_WIDTH = 1400;
const DEFAULT_JPEG_QUALITY = 0.85;

export type PdfPasswordReason = 'need' | 'incorrect';

/** 잠긴 PDF: 비밀번호가 필요하거나(need) 틀렸다(incorrect). */
export class PdfPasswordError extends Error {
  constructor(public readonly reason: PdfPasswordReason) {
    super(reason === 'incorrect' ? 'PDF 비밀번호가 맞지 않습니다' : 'PDF 비밀번호가 필요합니다');
    this.name = 'PdfPasswordError';
  }
}

/** 페이지 수가 허용 상한을 넘는 PDF. */
export class PdfTooManyPagesError extends Error {
  constructor(
    public readonly pageCount: number,
    public readonly max: number
  ) {
    super(`PDF 페이지가 너무 많습니다 (${pageCount} > ${max})`);
    this.name = 'PdfTooManyPagesError';
  }
}

async function loadPdfjs() {
  // pdf.js는 1MB 남짓이라 PDF를 첨부할 때만 동적으로 불러온다.
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
  return pdfjs;
}

/**
 * PDF 파일을 브라우저에서 열어 페이지마다 JPEG data URL로 렌더링한다.
 *
 * 서버로 PDF를 보내지 않고 이미지로 바꿔 보내는 이유:
 * - 잠긴 PDF(카드사 이용내역서 대부분)를 비밀번호로 열 수 있다 (pdf.js 네이티브 지원)
 * - 이미 검증된 "이미지 1장당 1회 호출" 파싱 파이프라인을 그대로 탄다
 * - 서버 측 PDF 의존성·용량 처리가 사라진다
 *
 * @throws PdfPasswordError 비밀번호 필요/불일치
 * @throws PdfTooManyPagesError 페이지 수 초과(렌더링 전에 거른다)
 */
export async function renderPdfToImages(
  file: File,
  options: {
    password?: string;
    maxPages: number;
    targetWidth?: number;
    quality?: number;
  }
): Promise<{ pages: string[]; pageCount: number }> {
  const {
    password,
    maxPages,
    targetWidth = DEFAULT_TARGET_WIDTH,
    quality = DEFAULT_JPEG_QUALITY,
  } = options;
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());

  const loadingTask = pdfjs.getDocument({ data, password });
  let doc: PDFDocumentProxy;
  try {
    doc = await loadingTask.promise;
  } catch (err) {
    if (err instanceof Error && err.name === 'PasswordException') {
      const code = (err as { code?: number }).code;
      throw new PdfPasswordError(
        code === pdfjs.PasswordResponses.INCORRECT_PASSWORD ? 'incorrect' : 'need'
      );
    }
    throw err;
  }

  try {
    if (doc.numPages > maxPages) {
      throw new PdfTooManyPagesError(doc.numPages, maxPages);
    }
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: targetWidth / base.width });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d context를 만들 수 없습니다');
      // 투명 배경이 JPEG에서 검게 나오지 않도록 흰색으로 깐다
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      pages.push(canvas.toDataURL('image/jpeg', quality));
      page.cleanup();
    }
    return { pages, pageCount: doc.numPages };
  } finally {
    // 문서·워커 자원 해제 (PDFDocumentProxy에는 destroy가 없고 loadingTask가 담당)
    await loadingTask.destroy();
  }
}
