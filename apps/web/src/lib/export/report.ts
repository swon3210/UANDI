/**
 * 월 결산 보고서/차트 내보내기 유틸 (클라이언트 전용).
 *
 * html2canvas-pro / jspdf 는 브라우저 전용이고 무거우므로 동적 import 로 로드한다.
 * (원조 html2canvas 는 Tailwind v4 의 oklch 색 함수를 파싱하지 못해 -pro 를 사용)
 */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 마크다운 문자열을 .md 파일로 다운로드 (의존성 없음). */
export function downloadMarkdown(filename: string, content: string) {
  triggerDownload(new Blob([content], { type: 'text/markdown;charset=utf-8' }), filename);
}

async function captureCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas-pro');
  return html2canvas(node, {
    scale: Math.min(2, window.devicePixelRatio || 1) * 1.5,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
}

/** DOM 요소를 PNG data URL 로 캡처 (마크다운 임베드용). */
export async function captureElementPngDataUrl(node: HTMLElement): Promise<string> {
  const canvas = await captureCanvas(node);
  return canvas.toDataURL('image/png');
}

/** DOM 요소를 PNG 이미지로 다운로드 (차트 캡처용). */
export async function downloadElementAsPng(node: HTMLElement, filename: string) {
  const canvas = await captureCanvas(node);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG 변환에 실패했습니다');
  triggerDownload(blob, filename);
}

/**
 * 여러 DOM 요소를 위에서 아래로 쌓아 하나의 A4 PDF로 다운로드.
 * 각 요소는 페이지 폭에 맞춰 축소되며, 남은 공간에 들어가지 않으면 새 페이지로 넘긴다.
 * 한 페이지보다 긴 요소(예: 긴 보고서)는 여러 페이지에 걸쳐 분할한다.
 */
export async function downloadElementsAsPdf(nodes: HTMLElement[], filename: string) {
  const valid = nodes.filter(Boolean);
  if (valid.length === 0) return;

  const [{ jsPDF }, ...canvases] = await Promise.all([
    import('jspdf'),
    ...valid.map((n) => captureCanvas(n)),
  ]);

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const imgWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  let cursorY = margin;
  let isFirst = true;

  for (const canvas of canvases) {
    const dataUrl = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= usableHeight) {
      // 한 블록으로 들어감 — 남은 공간 부족 시 새 페이지
      if (!isFirst && cursorY + imgHeight > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.addImage(dataUrl, 'PNG', margin, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 16;
    } else {
      // 한 페이지보다 긴 요소 — 페이지 분할
      if (!isFirst) {
        pdf.addPage();
      }
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        position -= usableHeight;
        pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }
      cursorY = pageHeight; // 다음 요소는 새 페이지에서 시작
    }
    isFirst = false;
  }

  pdf.save(filename);
}
