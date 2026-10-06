'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import { Sparkles, Loader2, ArrowUp, Paperclip, Plus } from 'lucide-react';
import { Textarea, Button, Sheet, cn } from '@uandi/ui';
import { compressAndEncode } from '@/utils/image-compress';
import { renderPdfToImages, PdfPasswordError, PdfTooManyPagesError } from '@/utils/pdf-render';
import { MAX_PDF_PAGES_PER_REQUEST } from '@/lib/ai/parse-entries-core';
import { AttachmentThumbnail } from './AttachmentThumbnail';
import { PdfPasswordSheet } from './PdfPasswordSheet';

type ParseResult = {
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

/** 이용내역서 PDF 1개 — 페이지별 렌더링 이미지 묶음 */
export type PdfAttachment = {
  name: string;
  pages: string[];
};

type AttachedImage = {
  id: string;
  kind: 'image';
  dataUrl: string;
  name: string;
  file: File;
};

type AttachedPdf = {
  id: string;
  kind: 'pdf';
  name: string;
  pages: string[];
};

type Attachment = AttachedImage | AttachedPdf;

type AiParseInputProps = {
  onParsed: (results: ParseResult[]) => void;
  categories: string[];
  parseFn: (
    text: string,
    categories: string[],
    images?: string[],
    pdfs?: PdfAttachment[]
  ) => Promise<ParseResult[]>;
  /**
   * 첨부 이미지를 영속 저장해야 하는 경우(예: 월 결산) 전달한다.
   * 압축된 파일과 함께 콜백되며, 상위에서 Storage 업로드를 담당한다. PDF는 대상이 아니다.
   * 미전달 시 기존 동작(이미지는 파싱 후 폐기)을 유지한다.
   */
  onImagePersist?: (img: { id: string; dataUrl: string; name: string; file: File }) => void;
  /**
   * 텍스트·첨부 입력이 없는 상태로 제출 버튼을 누르면 호출된다.
   * 전달 시 제출 버튼은 빈 입력에서도 활성화되며, AI 파싱 대신 이 콜백(예: 직접 입력 폼 열기)을 실행한다.
   * 미전달 시 기존 동작(빈 입력이면 제출 비활성화)을 유지한다.
   */
  onEmptySubmit?: () => void;
  /**
   * 텍스트영역에 추가할 클래스. 스크롤 시트 안에서는 포커스 링이 잘리지 않도록
   * inset 링(`focus-visible:ring-inset focus-visible:ring-offset-0`)을 전달한다.
   */
  textareaClassName?: string;
};

/** 이미지·PDF 합산 첨부 파일 수 상한 */
const MAX_ATTACHMENTS = 10;
/** PDF 파일 수 상한 (서버 스키마와 동일) */
const MAX_PDF_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
/**
 * 요청 본문 상한(문자 수 ≈ 바이트). Vercel 서버리스 함수의 요청 본문 한도(4.5MB) 아래로 묶는다.
 * 이미지는 1MB 이하로 압축되고 PDF 페이지는 JPEG이라 보통 여유가 있지만, 넘으면 제출 전에 막는다.
 */
const MAX_PAYLOAD_CHARS = 4_000_000;

const WRONG_PASSWORD_MESSAGE = '비밀번호가 맞지 않아요. 다시 입력해주세요.';

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiParseInput({
  onParsed,
  categories,
  parseFn,
  onImagePersist,
  onEmptySubmit,
  textareaClassName,
}: AiParseInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = attachments.filter((a): a is AttachedImage => a.kind === 'image');
  const pdfs = attachments.filter((a): a is AttachedPdf => a.kind === 'pdf');
  const usedPdfPages = pdfs.reduce((sum, p) => sum + p.pages.length, 0);

  const mutation = useMutation({
    mutationFn: (input: { text: string; images: string[]; pdfs: PdfAttachment[] }) =>
      parseFn(
        input.text,
        categories,
        input.images.length > 0 ? input.images : undefined,
        input.pdfs.length > 0 ? input.pdfs : undefined
      ),
    onSuccess: (results) => {
      onParsed(results);
      setText('');
      setAttachments([]);
    },
  });

  const handleSubmit = () => {
    if (mutation.isPending || isProcessingFiles) return;
    if (!text.trim() && attachments.length === 0) {
      // 입력이 없으면 AI 파싱 대신 직접 입력 폼을 연다(전달된 경우).
      onEmptySubmit?.();
      return;
    }
    const payloadChars =
      images.reduce((sum, img) => sum + img.dataUrl.length, 0) +
      pdfs.reduce((sum, pdf) => sum + pdf.pages.reduce((s, p) => s + p.length, 0), 0);
    if (payloadChars > MAX_PAYLOAD_CHARS) {
      toast.error('첨부 용량이 너무 커요. 이미지 수나 PDF 페이지를 줄여주세요');
      return;
    }
    // 영속 저장이 필요한 경우(월 결산): 제출 시점에 첨부 이미지를 업로드한다
    if (onImagePersist) {
      for (const img of images) onImagePersist(img);
    }
    mutation.mutate({
      text: text.trim(),
      images: images.map((img) => img.dataUrl),
      pdfs: pdfs.map((pdf) => ({ name: pdf.name, pages: pdf.pages })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /** 잠긴 PDF면 비밀번호 시트를 띄워 맞을 때까지(또는 건너뛸 때까지) 다시 연다. */
  const renderPdfWithPasswordFlow = async (
    file: File,
    maxPages: number
  ): Promise<AttachedPdf | null> => {
    let password: string | undefined;
    let errorMessage: string | undefined;
    for (;;) {
      try {
        const { pages } = await renderPdfToImages(file, { password, maxPages });
        return { id: newId(), kind: 'pdf', name: file.name, pages };
      } catch (err) {
        if (err instanceof PdfPasswordError) {
          errorMessage = err.reason === 'incorrect' ? WRONG_PASSWORD_MESSAGE : undefined;
          const entered = await overlay.openAsync<string | null>(({ isOpen, close, unmount }) => {
            const finish = (value: string | null) => {
              close(value);
              setTimeout(unmount, 300);
            };
            return (
              <Sheet open={isOpen} onOpenChange={(open) => !open && finish(null)}>
                <PdfPasswordSheet
                  fileName={file.name}
                  errorMessage={errorMessage}
                  onSubmit={finish}
                  onCancel={() => finish(null)}
                />
              </Sheet>
            );
          });
          if (entered == null) return null; // 건너뛰기
          password = entered;
          continue;
        }
        if (err instanceof PdfTooManyPagesError) {
          toast.error(
            `PDF는 한 번에 총 ${MAX_PDF_PAGES_PER_REQUEST}페이지까지 분석할 수 있어요 (${file.name}: ${err.pageCount}페이지)`
          );
          return null;
        }
        throw err;
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const selected = Array.from(fileList);
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) {
      toast.error(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 할 수 있어요`);
      e.target.value = '';
      return;
    }

    const accepted = selected.slice(0, remainingSlots);
    if (selected.length > remainingSlots) {
      toast.warning(
        `첨부는 최대 ${MAX_ATTACHMENTS}개까지 할 수 있어요. 앞 ${remainingSlots}개만 추가했어요`
      );
    }

    const oversized = accepted.filter((f) => f.size > MAX_FILE_SIZE);
    const sized = accepted.filter((f) => f.size <= MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(`10MB를 초과하는 파일은 추가할 수 없어요 (${oversized.length}개 제외)`);
    }

    const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    const imageFiles = sized.filter((f) => !isPdf(f));
    let pdfFiles = sized.filter(isPdf);
    const remainingPdfSlots = MAX_PDF_FILES - pdfs.length;
    if (pdfFiles.length > remainingPdfSlots) {
      toast.warning(`PDF는 최대 ${MAX_PDF_FILES}개까지 첨부할 수 있어요`);
      pdfFiles = pdfFiles.slice(0, Math.max(remainingPdfSlots, 0));
    }

    if (imageFiles.length === 0 && pdfFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setIsProcessingFiles(true);
    try {
      const encodedImages = await Promise.all(
        imageFiles.map(async (file): Promise<AttachedImage> => {
          const { dataUrl, file: compressed } = await compressAndEncode(file);
          return { id: newId(), kind: 'image', dataUrl, name: file.name, file: compressed };
        })
      );
      // PDF는 비밀번호 시트가 겹치지 않도록 한 파일씩 순서대로 처리한다.
      const renderedPdfs: AttachedPdf[] = [];
      let pageBudget = MAX_PDF_PAGES_PER_REQUEST - usedPdfPages;
      for (const file of pdfFiles) {
        const rendered = await renderPdfWithPasswordFlow(file, pageBudget);
        if (rendered) {
          renderedPdfs.push(rendered);
          pageBudget -= rendered.pages.length;
        }
      }
      setAttachments((prev) => [...prev, ...encodedImages, ...renderedPdfs]);
    } catch (err) {
      console.error('[AiParseInput] 첨부 처리 실패:', err);
      toast.error('첨부 파일을 처리하는 중 오류가 생겼어요');
    } finally {
      setIsProcessingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const hasInput = text.trim().length > 0 || attachments.length > 0;
  // onEmptySubmit이 있으면 빈 입력에서도 버튼을 활성화(폼 열기 용도).
  const canSubmit = !mutation.isPending && !isProcessingFiles && (hasInput || !!onEmptySubmit);
  const isEmptyAddMode = !hasInput && !!onEmptySubmit;

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {attachments.map((attachment, index) =>
            attachment.kind === 'image' ? (
              <AttachmentThumbnail
                key={attachment.id}
                kind="image"
                name={attachment.name}
                dataUrl={attachment.dataUrl}
                index={index}
                onRemove={() => handleRemoveAttachment(attachment.id)}
              />
            ) : (
              <AttachmentThumbnail
                key={attachment.id}
                kind="pdf"
                name={attachment.name}
                caption={`${attachment.pages.length}페이지`}
                index={index}
                onRemove={() => handleRemoveAttachment(attachment.id)}
              />
            )
          )}
        </div>
      )}

      <div className="relative rounded-md border border-input bg-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <Sparkles
          size={16}
          className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
        />
        <Textarea
          data-testid="ai-parse-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'예: 점심 김밥 5천원\n어제 택시 15000원'}
          className={cn(
            'min-h-[100px] max-h-40 resize-none border-0 bg-transparent pb-12 pl-9 pr-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
            textareaClassName
          )}
          rows={1}
          disabled={mutation.isPending}
        />
        <input
          ref={fileInputRef}
          data-testid="ai-parse-file-input"
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Button
            type="button"
            data-testid="ai-parse-attach"
            variant="ghost"
            size="icon"
            aria-label="영수증·PDF 첨부"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={
              mutation.isPending || isProcessingFiles || attachments.length >= MAX_ATTACHMENTS
            }
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessingFiles ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Paperclip size={16} />
            )}
          </Button>
          <Button
            data-testid="ai-parse-submit"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label={isEmptyAddMode ? '직접 입력' : 'AI 파싱'}
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isEmptyAddMode ? (
              <Plus size={16} />
            ) : (
              <ArrowUp size={16} />
            )}
          </Button>
        </div>
      </div>
      {mutation.error && (
        <p className="text-xs text-destructive">
          {mutation.error.message || 'AI 파싱에 실패했습니다'}
        </p>
      )}
    </div>
  );
}
