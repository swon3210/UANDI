'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/sheet';
import { Textarea } from '../../components/textarea';

export const COMMUNITY_COMPOSER_MAX_BODY = 1000;
export const COMMUNITY_COMPOSER_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const formSchema = z.object({
  body: z
    .string()
    .min(1, '본문을 입력해주세요')
    .max(COMMUNITY_COMPOSER_MAX_BODY, `본문은 ${COMMUNITY_COMPOSER_MAX_BODY}자까지 가능해요`),
});

type FormValues = z.infer<typeof formSchema>;

export type CommunityComposerSubmit = {
  body: string;
  imageFile: File | null;
};

export type CommunityComposerProps = {
  onSubmit: (values: CommunityComposerSubmit) => void | Promise<void>;
  isPending?: boolean;
};

export function CommunityComposer({ onSubmit, isPending }: CommunityComposerProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { body: '' },
    mode: 'onChange',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputId = useId();

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 첨부할 수 있어요');
      e.target.value = '';
      return;
    }
    if (file.size > COMMUNITY_COMPOSER_MAX_IMAGE_BYTES) {
      setImageError('이미지는 5MB 이하만 가능해요');
      e.target.value = '';
      return;
    }
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageError(null);
  };

  const handleSubmit = form.handleSubmit(async ({ body }) => {
    await onSubmit({ body, imageFile });
  });

  return (
    <SheetContent
      side="bottom"
      data-testid="community-composer"
      className="rounded-t-[20px] max-h-[90vh]"
    >
      <SheetHeader>
        <SheetTitle>글쓰기</SheetTitle>
        <SheetDescription className="sr-only">
          신혼부부 커뮤니티에 글을 올립니다
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">본문</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    data-testid="composer-body"
                    placeholder="무슨 일이 있었나요?"
                    rows={6}
                    maxLength={COMMUNITY_COMPOSER_MAX_BODY}
                    className="resize-none"
                  />
                </FormControl>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <FormMessage />
                  <span className="tabular-nums">
                    {field.value.length}/{COMMUNITY_COMPOSER_MAX_BODY}
                  </span>
                </div>
              </FormItem>
            )}
          />

          {previewUrl ? (
            <div
              data-testid="composer-image-preview"
              className="relative inline-block rounded-lg border border-border"
            >
              <img
                src={previewUrl}
                alt=""
                className="h-24 w-24 rounded-lg object-cover"
              />
              <button
                type="button"
                aria-label="이미지 제거"
                onClick={handleRemoveImage}
                className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-md"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              htmlFor={imageInputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-border bg-secondary px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              <ImagePlus size={16} />
              이미지 추가
            </label>
          )}
          <input
            id={imageInputId}
            data-testid="composer-image-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageChange}
          />
          {imageError ? <p className="text-xs text-destructive">{imageError}</p> : null}

          <Button
            type="submit"
            className="w-full"
            disabled={
              !form.formState.isValid || form.formState.isSubmitting || !!isPending
            }
          >
            {form.formState.isSubmitting || isPending ? '올리는 중...' : '올리기'}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
