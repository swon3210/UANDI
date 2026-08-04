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

export const PROFILE_NAME_MAX_LENGTH = 20;

const formSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, '이름을 입력해주세요')
    .max(PROFILE_NAME_MAX_LENGTH, `이름은 ${PROFILE_NAME_MAX_LENGTH}자까지 가능해요`),
});

type FormValues = z.infer<typeof formSchema>;

export type ProfileEditFormSubmit = FormValues;

export type ProfileEditFormProps = {
  initialDisplayName: string;
  onSubmit: (values: ProfileEditFormSubmit) => void | Promise<void>;
  isSubmitting?: boolean;
};

/** 이름(displayName) 편집 폼. 프레젠테이션 전용 — 저장은 onSubmit으로 위임한다. */
export function ProfileEditForm({
  initialDisplayName,
  onSubmit,
  isSubmitting,
}: ProfileEditFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: initialDisplayName },
    mode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    // 저장 성공 후 dirty 상태를 저장값 기준으로 리셋 → 버튼이 다시 비활성화된다.
    form.reset(values);
  });

  const saving = form.formState.isSubmitting || !!isSubmitting;
  const disabled = !form.formState.isValid || !form.formState.isDirty || saving;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  data-testid="profile-name-input"
                  placeholder="이름을 입력하세요"
                  maxLength={PROFILE_NAME_MAX_LENGTH}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          data-testid="profile-name-save"
          disabled={disabled}
        >
          {saving ? '저장하는 중...' : '이름 저장'}
        </Button>
      </form>
    </Form>
  );
}
