'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/sheet';

const formSchema = z.object({
  siteName: z.string().min(1, '출처명을 입력해주세요').max(50, '출처명은 50자까지 가능해요'),
  feedUrl: z
    .string()
    .min(1, '피드 URL을 입력해주세요')
    .url('올바른 URL을 입력해주세요')
    .refine((v) => /^https?:\/\//.test(v), 'http(s) URL만 가능해요'),
});

type FormValues = z.infer<typeof formSchema>;

export type SourceFormSubmit = FormValues;

export type SourceFormProps = {
  onSubmit: (values: SourceFormSubmit) => void | Promise<void>;
  isPending?: boolean;
  /** 'create'(기본)는 소스 추가, 'edit'는 기존 소스 수정. */
  mode?: 'create' | 'edit';
  initialSiteName?: string;
  initialFeedUrl?: string;
};

export function SourceForm({
  onSubmit,
  isPending,
  mode = 'create',
  initialSiteName = '',
  initialFeedUrl = '',
}: SourceFormProps) {
  const isEdit = mode === 'edit';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { siteName: initialSiteName, feedUrl: initialFeedUrl },
    mode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <SheetContent
      side="bottom"
      data-testid="source-form"
      className="rounded-t-[20px] max-h-[90vh]"
    >
      <SheetHeader>
        <SheetTitle>{isEdit ? '소스 수정' : '소스 추가'}</SheetTitle>
        <SheetDescription className="sr-only">
          {isEdit ? '크롤 소스를 수정합니다' : 'RSS/공식 피드 크롤 소스를 추가합니다'}
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            control={form.control}
            name="siteName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출처명</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="source-sitename"
                    placeholder="예: 결혼 매거진"
                    maxLength={50}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="feedUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>피드 URL (RSS/Atom)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="source-feedurl"
                    placeholder="https://example.com/rss"
                    inputMode="url"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!form.formState.isValid || form.formState.isSubmitting || !!isPending}
          >
            {form.formState.isSubmitting || isPending
              ? isEdit
                ? '수정하는 중...'
                : '추가하는 중...'
              : isEdit
                ? '수정하기'
                : '추가하기'}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
