'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles, Loader2, ArrowUp, Paperclip, X, Plus } from 'lucide-react';
import { Textarea, Button, cn } from '@uandi/ui';
import { compressAndEncode } from '@/utils/image-compress';

type ParseResult = {
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

type AttachedImage = {
  id: string;
  dataUrl: string;
  name: string;
  file: File;
};

type AiParseInputProps = {
  onParsed: (results: ParseResult[]) => void;
  categories: string[];
  parseFn: (text: string, categories: string[], images?: string[]) => Promise<ParseResult[]>;
  /**
   * 첨부 이미지를 영속 저장해야 하는 경우(예: 월 결산) 전달한다.
   * 압축된 파일과 함께 콜백되며, 상위에서 Storage 업로드를 담당한다.
   * 미전달 시 기존 동작(이미지는 파싱 후 폐기)을 유지한다.
   */
  onImagePersist?: (img: { id: string; dataUrl: string; name: string; file: File }) => void;
  /**
   * 텍스트·이미지 입력이 없는 상태로 제출 버튼을 누르면 호출된다.
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

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AiParseInput({
  onParsed,
  categories,
  parseFn,
  onImagePersist,
  onEmptySubmit,
  textareaClassName,
}: AiParseInputProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (input: { text: string; images: string[] }) =>
      parseFn(input.text, categories, input.images.length > 0 ? input.images : undefined),
    onSuccess: (results) => {
      onParsed(results);
      setText('');
      setImages([]);
    },
  });

  const handleSubmit = () => {
    if (mutation.isPending || isProcessingFiles) return;
    if (!text.trim() && images.length === 0) {
      // 입력이 없으면 AI 파싱 대신 직접 입력 폼을 연다(전달된 경우).
      onEmptySubmit?.();
      return;
    }
    // 영속 저장이 필요한 경우(월 결산): 제출 시점에 첨부 이미지를 업로드한다
    if (onImagePersist) {
      for (const img of images) onImagePersist(img);
    }
    mutation.mutate({
      text: text.trim(),
      images: images.map((img) => img.dataUrl),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const selected = Array.from(fileList);
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요`);
      e.target.value = '';
      return;
    }

    const accepted = selected.slice(0, remainingSlots);
    if (selected.length > remainingSlots) {
      toast.warning(
        `이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요. 앞 ${remainingSlots}장만 추가했어요`
      );
    }

    const oversized = accepted.filter((f) => f.size > MAX_FILE_SIZE);
    const sized = accepted.filter((f) => f.size <= MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(`10MB를 초과하는 파일은 추가할 수 없어요 (${oversized.length}개 제외)`);
    }
    if (sized.length === 0) {
      e.target.value = '';
      return;
    }

    setIsProcessingFiles(true);
    try {
      const encoded = await Promise.all(
        sized.map(async (file) => {
          const { dataUrl, file: compressed } = await compressAndEncode(file);
          return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            dataUrl,
            name: file.name,
            file: compressed,
          };
        })
      );
      setImages((prev) => [...prev, ...encoded]);
    } catch (err) {
      console.error('[AiParseInput] 이미지 처리 실패:', err);
      toast.error('이미지를 처리하는 중 오류가 생겼어요');
    } finally {
      setIsProcessingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const hasInput = text.trim().length > 0 || images.length > 0;
  // onEmptySubmit이 있으면 빈 입력에서도 버튼을 활성화(폼 열기 용도).
  const canSubmit = !mutation.isPending && !isProcessingFiles && (hasInput || !!onEmptySubmit);
  const isEmptyAddMode = !hasInput && !!onEmptySubmit;

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {images.map((img, index) => (
            <div
              key={img.id}
              data-testid={`ai-parse-thumbnail-${index}`}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                data-testid={`ai-parse-thumbnail-remove-${index}`}
                aria-label={`${img.name} 제거`}
                onClick={() => handleRemoveImage(img.id)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
              >
                <X size={12} />
              </button>
            </div>
          ))}
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
          accept="image/*"
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
            aria-label="영수증 첨부"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={mutation.isPending || isProcessingFiles || images.length >= MAX_IMAGES}
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
