'use client';

import { useForm, useWatch } from 'react-hook-form';
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
  Badge,
  RadioGroup,
  RadioGroupItem,
  Label,
  Separator,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@uandi/ui';
import { Lock } from 'lucide-react';
import type { CashbookCategory, CategoryGroup, CategorySubGroup } from '@/types';
import {
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_LABELS,
  SUB_GROUP_SHORT_LABELS,
  COLOR_PRESETS,
} from '@/constants/default-categories';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';
import { CategoryIcon } from './CategoryIcon';
import { ExampleTagInput, ExampleChipList, EXAMPLES_MAX } from './ExampleTagInput';
import { RecurringScheduleFields } from './RecurringScheduleFields';

// 정기 발생 설정을 노출할 subGroup (고정 지출 / 고정 수입)
const RECURRENCE_SUBGROUPS: CategorySubGroup[] = ['fixed_expense', 'regular_income'];

const recurrenceSchema = z
  .object({
    enabled: z.boolean(),
    kind: z.enum(['dayOfMonth', 'nthWeekday']),
    dayOfMonth: z.number().min(1).max(31).optional(),
    week: z.number().optional(),
    weekday: z.number().min(1).max(7).optional(),
    leadDays: z.number().min(0).max(7).optional(),
    expectedAmount: z.number().min(0).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.enabled) return;
    if (val.kind === 'dayOfMonth') {
      if (val.dayOfMonth == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '며칠에 발생하는지 입력해주세요',
          path: ['dayOfMonth'],
        });
      }
    } else {
      if (val.week == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '몇째 주인지 선택해주세요',
          path: ['week'],
        });
      }
      if (val.weekday == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '요일을 선택해주세요',
          path: ['weekday'],
        });
      }
    }
  });

const schema = z.object({
  name: z.string().min(1, '카테고리 이름을 입력해주세요'),
  icon: z.string().min(1, '아이콘을 선택해주세요'),
  color: z.string().min(1),
  subGroup: z.string().min(1, '구분을 선택해주세요'),
  description: z.string().max(140, '설명은 140자 이내로 입력해주세요'),
  examples: z
    .array(z.string().min(1).max(20))
    .max(EXAMPLES_MAX, `예시는 ${EXAMPLES_MAX}개까지 입력할 수 있어요`),
  recurrence: recurrenceSchema,
});

type FormValues = z.infer<typeof schema>;

type CategoryFormProps = {
  group: CategoryGroup;
  /** 자식 추가 모드. 값이 있으면 부모가 잠긴 상태로 표시되고 subGroup도 부모 값 고정. */
  parentCategory?: CashbookCategory;
  editingCategory?: CashbookCategory;
  isSubmitting?: boolean;
  onSubmit: (data: FormValues) => Promise<void>;
  onClose: () => void;
};

export function CategoryForm({
  group,
  parentCategory,
  editingCategory,
  isSubmitting,
  onSubmit,
  onClose,
}: CategoryFormProps) {
  const subGroups = SUB_GROUPS_BY_GROUP[group];
  const isChildMode = !!parentCategory;
  const lockedSubGroup = parentCategory?.subGroup;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: editingCategory?.name ?? '',
      icon: editingCategory?.icon ?? parentCategory?.icon ?? '',
      color: editingCategory?.color ?? parentCategory?.color ?? COLOR_PRESETS[0],
      subGroup: editingCategory?.subGroup ?? lockedSubGroup ?? subGroups[0],
      description: editingCategory?.description ?? '',
      examples: editingCategory?.examples ?? [],
      recurrence: editingCategory?.recurrence
        ? {
            enabled: editingCategory.recurrence.enabled,
            kind: editingCategory.recurrence.kind,
            dayOfMonth: editingCategory.recurrence.dayOfMonth,
            week: editingCategory.recurrence.week,
            weekday: editingCategory.recurrence.weekday,
            leadDays: editingCategory.recurrence.leadDays,
            expectedAmount: editingCategory.recurrence.expectedAmount ?? null,
          }
        : { enabled: false, kind: 'dayOfMonth' },
    },
  });

  const currentSubGroup = useWatch({ control: form.control, name: 'subGroup' });
  const showRecurrence = RECURRENCE_SUBGROUPS.includes(currentSubGroup as CategorySubGroup);

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
        <SheetTitle>
          {editingCategory ? '카테고리 편집' : isChildMode ? '하위 카테고리 추가' : '카테고리 추가'}
        </SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto px-1 pb-6 pt-4"
        >
          {isChildMode && parentCategory && (
            <div className="flex flex-col gap-1.5">
              <Label>부모 카테고리</Label>
              <div
                data-testid="locked-parent"
                className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: parentCategory.color + '20',
                    color: parentCategory.color,
                  }}
                >
                  <CategoryIcon name={parentCategory.icon} size={14} />
                </span>
                <span className="text-foreground">{parentCategory.name}</span>
                <Badge variant="secondary" className="font-normal">
                  {SUB_GROUP_SHORT_LABELS[parentCategory.subGroup]}
                </Badge>
                <Lock size={12} className="ml-auto" />
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder={isChildMode ? '예: 외식' : '예: 정기급여'} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설명 (선택)</FormLabel>
                <FormControl>
                  <Input placeholder="이 카테고리에 어떤 항목이 들어가나요?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="examples"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예시 항목 (선택)</FormLabel>
                <ExampleChipList
                  value={field.value}
                  onRemove={(v) => field.onChange(field.value.filter((x) => x !== v))}
                />
                <FormControl>
                  <ExampleTagInput
                    value={field.value}
                    onAdd={(v) => field.onChange([...field.value, v])}
                    onRemoveLast={() => field.onChange(field.value.slice(0, -1))}
                  />
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

          <div className="mx-1">
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

          {!isChildMode && (
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
          )}

          {showRecurrence && (
            <>
              <Separator />
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RecurringScheduleFields
                        value={field.value}
                        onChange={field.onChange}
                        variant={group === 'income' ? 'income' : 'expense'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
