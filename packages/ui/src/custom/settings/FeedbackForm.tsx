'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '../../components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/form';
import { Input } from '../../components/input';
import { Textarea } from '../../components/textarea';
import { FeedbackTypeSelector, type FeedbackType } from './FeedbackTypeSelector';

export const FEEDBACK_MIN_CONTENT = 10;
export const FEEDBACK_MAX_CONTENT = 2000;
/** 압축 전 원본 상한. 업로드 전 앱에서 1MB 이하로 압축한다. */
export const FEEDBACK_MAX_SCREENSHOT_BYTES = 20 * 1024 * 1024;

const FEEDBACK_TYPES: readonly string[] = ['bug', 'idea', 'other'];

const formSchema = z.object({
  type: z.string().refine((v) => FEEDBACK_TYPES.includes(v), '어떤 내용인지 골라 주세요'),
  content: z
    .string()
    .trim()
    .min(FEEDBACK_MIN_CONTENT, `${FEEDBACK_MIN_CONTENT}자 이상 적어 주세요`)
    .max(FEEDBACK_MAX_CONTENT, `${FEEDBACK_MAX_CONTENT}자까지 적을 수 있어요`),
  email: z
    .string()
    .trim()
    .max(254, '이메일 형식을 확인해 주세요')
    .refine((v) => v === '' || z.email().safeParse(v).success, '이메일 형식을 확인해 주세요'),
});

type FormValues = z.infer<typeof formSchema>;

export type FeedbackFormSubmit = {
  type: FeedbackType;
  content: string;
  /** 비우면 null — 답장을 받지 않는다. */
  contactEmail: string | null;
  screenshot: File | null;
};

export type FeedbackFormProps = {
  /** 연락 이메일 기본값(로그인 이메일). */
  defaultEmail?: string;
  onSubmit: (values: FeedbackFormSubmit) => void | Promise<void>;
  isPending?: boolean;
  /** 스토리·테스트용 초기값. */
  initialValues?: Partial<{ type: FeedbackType; content: string }>;
};

/**
 * 의견 보내기 폼(docs/pages/07-feedback.md). 유형·내용·연락 이메일·스크린샷 1장.
 * 기기·앱 정보 수집과 업로드는 caller(앱)가 onSubmit에서 처리한다.
 */
export function FeedbackForm({
  defaultEmail = '',
  onSubmit,
  isPending,
  initialValues,
}: FeedbackFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialValues?.type ?? '',
      content: initialValues?.content ?? '',
      email: defaultEmail,
    },
  });

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const inputId = useId();

  const previewUrl = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot) : null),
    [screenshot]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreenshotError(null);
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScreenshotError('이미지 파일만 첨부할 수 있어요');
      return;
    }
    if (file.size > FEEDBACK_MAX_SCREENSHOT_BYTES) {
      setScreenshotError('이미지는 20MB 이하만 첨부할 수 있어요');
      return;
    }
    setScreenshot(file);
  };

  const handleSubmit = form.handleSubmit(async ({ type, content, email }) => {
    await onSubmit({
      type: type as FeedbackType,
      content,
      contactEmail: email === '' ? null : email,
      screenshot,
    });
  });

  const pending = form.formState.isSubmitting || !!isPending;
  const selectedType = useWatch({ control: form.control, name: 'type' });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <FormField
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>어떤 내용인가요?</FormLabel>
              <FormControl>
                <FeedbackTypeSelector
                  value={(field.value || null) as FeedbackType | null}
                  onValueChange={field.onChange}
                  disabled={pending}
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>내용</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  data-testid="feedback-content"
                  rows={6}
                  maxLength={FEEDBACK_MAX_CONTENT}
                  disabled={pending}
                  className="resize-none"
                  placeholder={
                    selectedType === 'bug'
                      ? '어떤 화면에서 무엇을 했을 때 어떻게 됐는지 적어 주세요'
                      : '자유롭게 적어 주세요'
                  }
                />
              </FormControl>
              <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                <FormMessage />
                <span className="ml-auto tabular-nums">
                  {field.value.length}/{FEEDBACK_MAX_CONTENT}
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>답장받을 이메일 (선택)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  data-testid="feedback-email"
                  disabled={pending}
                  placeholder="비워 두면 답장을 보내지 않아요"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">스크린샷 (선택)</p>
          {previewUrl ? (
            <div
              data-testid="feedback-screenshot-preview"
              className="relative inline-block rounded-lg border border-border"
            >
              <img
                src={previewUrl}
                alt="첨부한 스크린샷"
                className="h-28 w-28 rounded-lg object-cover"
              />
              <button
                type="button"
                aria-label="스크린샷 삭제"
                data-testid="feedback-screenshot-remove"
                onClick={() => setScreenshot(null)}
                disabled={pending}
                className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-md"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              <ImagePlus size={16} />
              스크린샷 추가
            </label>
          )}
          <input
            id={inputId}
            data-testid="feedback-screenshot-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            disabled={pending}
          />
          {screenshotError ? <p className="text-xs text-destructive">{screenshotError}</p> : null}
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            앱 버전, 기기 정보, 직전에 보던 화면이 함께 전송돼요. 가계부 내용은 보내지 않아요.
          </p>
          <Button type="submit" className="w-full" data-testid="feedback-submit" disabled={pending}>
            {pending ? '보내는 중…' : '보내기'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
