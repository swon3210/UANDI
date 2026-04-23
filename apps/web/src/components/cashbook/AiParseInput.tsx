'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles, Loader2, ArrowUp, Paperclip, X } from 'lucide-react';
import { Textarea, Button } from '@uandi/ui';

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
};

type AiParseInputProps = {
  onParsed: (results: ParseResult[]) => void;
  categories: string[];
  parseFn: (
    text: string,
    categories: string[],
    images?: string[]
  ) => Promise<ParseResult[]>;
};

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function compressAndEncode(file: File): Promise<string> {
  const imageCompression = (await import('browser-image-compression')).default;
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    initialQuality: 0.85,
    useWebWorker: true,
  });
  return readFileAsDataUrl(compressed);
}

export function AiParseInput({ onParsed, categories, parseFn }: AiParseInputProps) {
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
    if (!text.trim() && images.length === 0) return;
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
      toast.warning(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요. 앞 ${remainingSlots}장만 추가했어요`);
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
        sized.map(async (file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          dataUrl: await compressAndEncode(file),
          name: file.name,
        }))
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

  const canSubmit =
    !mutation.isPending &&
    !isProcessingFiles &&
    (text.trim().length > 0 || images.length > 0);

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
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-full w-full object-cover"
              />
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

      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Sparkles
            size={16}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <Textarea
            data-testid="ai-parse-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              '여러 건 입력 가능 (Shift+Enter 줄바꿈)\n예: 점심 김밥 5천원\n어제 택시 15000원'
            }
            className="pl-9 pr-10 min-h-[100px] max-h-40"
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
          <Button
            type="button"
            data-testid="ai-parse-attach"
            variant="ghost"
            size="icon"
            aria-label="영수증 첨부"
            className="absolute right-1.5 bottom-1.5 h-7 w-7 text-muted-foreground hover:text-foreground"
            disabled={mutation.isPending || isProcessingFiles || images.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessingFiles ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Paperclip size={16} />
            )}
          </Button>
        </div>
        <Button
          data-testid="ai-parse-submit"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label="AI 파싱"
        >
          {mutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} />
          )}
        </Button>
      </div>
      {mutation.error && (
        <p className="text-xs text-destructive">
          {mutation.error.message || 'AI 파싱에 실패했습니다'}
        </p>
      )}
    </div>
  );
}
