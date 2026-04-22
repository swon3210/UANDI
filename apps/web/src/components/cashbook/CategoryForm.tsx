'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Button,
  RadioGroup,
  RadioGroupItem,
  Label,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import type { CashbookCategory, CategoryGroup, CategorySubGroup } from '@/types';
import { SUB_GROUPS_BY_GROUP, SUB_GROUP_LABELS, COLOR_PRESETS } from '@/constants/default-categories';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';

const schema = z.object({
  name: z.string().min(1, '카테고리 이름을 입력해주세요'),
  icon: z.string().min(1, '아이콘을 선택해주세요'),
  color: z.string().min(1),
  subGroup: z.string().min(1, '구분을 선택해주세요'),
});

type FormValues = z.infer<typeof schema>;

type CategoryFormProps = {
  group: CategoryGroup;
  editingCategory?: CashbookCategory;
  isSubmitting?: boolean;
  onSubmit: (data: FormValues) => Promise<void>;
  onClose: () => void;
};

export function CategoryForm({
  group,
  editingCategory,
  isSubmitting,
  onSubmit,
  onClose,
}: CategoryFormProps) {
  const subGroups = SUB_GROUPS_BY_GROUP[group];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editingCategory?.name ?? '',
      icon: editingCategory?.icon ?? '',
      color: editingCategory?.color ?? COLOR_PRESETS[0],
      subGroup: editingCategory?.subGroup ?? subGroups[0],
    },
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      await onSubmit(data);
      onClose();
    } catch {
      // mutation onError에서 toast 처리
    }
  };

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[20px] max-h-[90vh] flex flex-col"
      data-testid="category-form-sheet"
    >
      <SheetHeader>
        <SheetTitle>{editingCategory ? '카테고리 편집' : '카테고리 추가'}</SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto px-1 pb-6 pt-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder="예: 정기급여" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>아이콘</FormLabel>
                <FormControl>
                  <IconPicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='mx-1'>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>색상</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>구분</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap gap-2"
                  >
                    {subGroups.map((sg) => (
                      <div key={sg} className="flex items-center">
                        <RadioGroupItem value={sg} id={sg} className="sr-only" />
                        <Label
                          htmlFor={sg}
                          className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                            field.value === sg
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary border-border hover:bg-accent'
                          }`}
                        >
                          {SUB_GROUP_LABELS[sg as CategorySubGroup]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
