'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';

const schema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type FormValues = z.infer<typeof schema>;

type PdfPasswordSheetProps = {
  fileName: string;
  /** 직전 시도가 틀렸을 때 보여줄 메시지 */
  errorMessage?: string;
  isSubmitting?: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
};

/**
 * 잠긴 PDF의 열람 비밀번호를 받는 바텀시트.
 * 카드사 이용내역서는 대개 생년월일 등으로 잠겨 있어, 첨부 직후 이 시트를 띄운다.
 */
export function PdfPasswordSheet({
  fileName,
  errorMessage,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: PdfPasswordSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  });

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh]"
      data-testid="pdf-password-sheet"
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          PDF 비밀번호
        </SheetTitle>
        <SheetDescription className="truncate" title={fileName}>
          {fileName} 파일이 잠겨 있어요. 열람 비밀번호를 입력해주세요.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(values.password))}
          className="mt-4 space-y-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="off"
                    autoFocus
                    inputMode="text"
                    data-testid="pdf-password-input"
                    placeholder="예: 생년월일 6자리"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {errorMessage && (
                  <p className="text-xs text-destructive" data-testid="pdf-password-error">
                    {errorMessage}
                  </p>
                )}
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="pdf-password-cancel"
            >
              이 파일 건너뛰기
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
              data-testid="pdf-password-submit"
            >
              열기
            </Button>
          </div>
        </form>
      </Form>
    </SheetContent>
  );
}
