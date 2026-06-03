'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search } from 'lucide-react';
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
  /**
   * 페이지 URL로 RSS 피드를 자동 탐지. 제공되면 "링크로 찾기" 입력이 노출된다.
   * 성공 시 { feedUrl, siteName }을 반환, 실패 시 null.
   */
  onDiscover?: (pageUrl: string) => Promise<{ feedUrl: string; siteName: string } | null>;
};

export function SourceForm({
  onSubmit,
  isPending,
  mode = 'create',
  initialSiteName = '',
  initialFeedUrl = '',
  onDiscover,
}: SourceFormProps) {
  const isEdit = mode === 'edit';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { siteName: initialSiteName, feedUrl: initialFeedUrl },
    mode: 'onChange',
  });

  const [pageUrl, setPageUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const handleDiscover = async () => {
    if (!onDiscover || !pageUrl.trim()) return;
    setDiscovering(true);
    setDiscoverError(null);
    try {
      const found = await onDiscover(pageUrl.trim());
      if (!found) {
        setDiscoverError('이 페이지에서 RSS 피드를 찾지 못했어요. 피드 URL을 직접 입력해주세요.');
        return;
      }
      form.setValue('feedUrl', found.feedUrl, { shouldValidate: true });
      if (!form.getValues('siteName')) {
        form.setValue('siteName', found.siteName.slice(0, 50), { shouldValidate: true });
      }
    } catch {
      setDiscoverError('탐지 중 오류가 났어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setDiscovering(false);
    }
  };

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

      {onDiscover ? (
        <div className="mt-4 space-y-2 rounded-[10px] border border-dashed border-border bg-secondary/50 p-3">
          <label className="text-sm font-medium" htmlFor="source-discover-input">
            링크로 RSS 찾기
          </label>
          <div className="flex gap-2">
            <Input
              id="source-discover-input"
              data-testid="source-discover-input"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleDiscover();
                }
              }}
              placeholder="블로그/글 주소 붙여넣기"
              inputMode="url"
            />
            <Button
              type="button"
              variant="outline"
              data-testid="source-discover-btn"
              onClick={handleDiscover}
              disabled={discovering || !pageUrl.trim()}
              className="shrink-0"
            >
              <Search size={16} className="mr-1" />
              {discovering ? '찾는 중...' : 'RSS 찾기'}
            </Button>
          </div>
          {discoverError ? (
            <p className="text-xs text-destructive" data-testid="source-discover-error">
              {discoverError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              아무 글/블로그 링크를 넣으면 RSS 피드를 자동으로 찾아 아래를 채워줘요.
            </p>
          )}
        </div>
      ) : null}

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
