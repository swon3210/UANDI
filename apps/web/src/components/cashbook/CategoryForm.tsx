'use client';

import { useCategoryLabels } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
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
  RECURRENCE_SUBGROUPS,
  COLOR_PRESETS,
} from '@/constants/default-categories';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';
import { CategoryIcon } from './CategoryIcon';
import { ExampleTagInput, ExampleChipList, EXAMPLES_MAX } from './ExampleTagInput';
import { RecurringScheduleFields } from './RecurringScheduleFields';

/** 로케일별 폼 에러 문구 (cashbook.categoryForm) */
type CategoryFormMessages = {
  amountInteger: string;
  dayRequired: string;
  weekRequired: string;
  weekdayRequired: string;
  nameRequired: string;
  iconRequired: string;
  subGroupRequired: string;
  descriptionTooLong: string;
  tooManyExamples: string;
  duplicateName: string;
};

const buildRecurrenceSchema = (msg: CategoryFormMessages) =>
  z
    .object({
      enabled: z.boolean(),
      kind: z.enum(['dayOfMonth', 'nthWeekday']),
      dayOfMonth: z.number().min(1).max(31).optional(),
      week: z.number().optional(),
      weekday: z.number().min(1).max(7).optional(),
      leadDays: z.number().min(0).max(7).optional(),
      expectedAmount: z.number().int(msg.amountInteger).min(0).nullable().optional(),
      intervalMonths: z.number().optional(),
      anchorMonth: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (!val.enabled) return;
      if (val.kind === 'dayOfMonth') {
        if (val.dayOfMonth == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg.dayRequired,
            path: ['dayOfMonth'],
          });
        }
      } else {
        if (val.week == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg.weekRequired,
            path: ['week'],
          });
        }
        if (val.weekday == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg.weekdayRequired,
            path: ['weekday'],
          });
        }
      }
    });

const buildSchema = (msg: CategoryFormMessages) =>
  z.object({
    name: z.string().min(1, msg.nameRequired),
    icon: z.string().min(1, msg.iconRequired),
    color: z.string().min(1),
    subGroup: z.string().min(1, msg.subGroupRequired),
    description: z.string().max(140, msg.descriptionTooLong),
    examples: z.array(z.string().min(1).max(20)).max(EXAMPLES_MAX, msg.tooManyExamples),
    recurrence: buildRecurrenceSchema(msg),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

/** 추가 모드에서 폼을 미리 채울 값(정기 발생 제안 → 새 고정 카테고리 만들기 등). */
export type CategoryFormInitialValues = Partial<
  Pick<FormValues, 'name' | 'icon' | 'color' | 'description' | 'examples' | 'recurrence'>
>;

type CategoryFormProps = {
  group: CategoryGroup;
  /** 자식 추가 모드. 값이 있으면 부모가 잠긴 상태로 표시되고 subGroup도 부모 값 고정. */
  parentCategory?: CashbookCategory;
  editingCategory?: CashbookCategory;
  /**
   * 부모 없이 구분만 잠그는 추가 모드(예: 정기 발생 제안에서 새 고정 지출 카테고리 만들기).
   * 구분 라디오 대신 잠긴 배지를 보여주고 subGroup은 이 값으로 고정된다.
   */
  lockedSubGroup?: CategorySubGroup;
  /** 추가 모드 초기값(prefill). editingCategory가 있으면 무시된다. */
  initialValues?: CategoryFormInitialValues;
  /** 이 이름들은 저장을 거부한다(내역이 카테고리 이름으로 연결되므로 group 안에서 중복 금지). */
  takenNames?: string[];
  /** 시트 제목 override. */
  title?: string;
  isSubmitting?: boolean;
  onSubmit: (data: FormValues) => Promise<void>;
  onClose: () => void;
};

export function CategoryForm({
  group,
  parentCategory,
  editingCategory,
  lockedSubGroup: lockedSubGroupProp,
  initialValues,
  takenNames,
  title,
  isSubmitting,
  onSubmit,
  onClose,
}: CategoryFormProps) {
  const t = useTranslations('cashbook.categoryForm');
  const labels = useCategoryLabels();
  // 에러 문구·스키마는 로케일(t)이 바뀔 때만 다시 만든다.
  const { msg, schema } = useMemo(() => {
    const msg: CategoryFormMessages = {
      amountInteger: t('amountInteger'),
      dayRequired: t('dayRequired'),
      weekRequired: t('weekRequired'),
      weekdayRequired: t('weekdayRequired'),
      nameRequired: t('nameRequired'),
      iconRequired: t('iconRequired'),
      subGroupRequired: t('subGroupRequired'),
      descriptionTooLong: t('descriptionTooLong'),
      tooManyExamples: t('tooManyExamples', { max: EXAMPLES_MAX }),
      duplicateName: t('duplicateName'),
    };
    return { msg, schema: buildSchema(msg) };
  }, [t]);
  const subGroups = SUB_GROUPS_BY_GROUP[group];
  const isChildMode = !!parentCategory;
  const lockedSubGroup = parentCategory?.subGroup ?? lockedSubGroupProp;
  const isSubGroupLocked = isChildMode || !!lockedSubGroupProp;
  const prefill = editingCategory ? undefined : initialValues;

  // 내역은 카테고리 이름으로 연결되므로 takenNames(같은 group의 기존 이름)와 겹치면 저장을 거부한다.
  // 편집 중인 카테고리 자신의 이름은 허용.
  const editingName = editingCategory?.name;
  const resolvedSchema = useMemo(
    () =>
      schema.superRefine((val, ctx) => {
        const name = val.name.trim();
        if (takenNames?.some((n) => n === name && n !== editingName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: msg.duplicateName,
            path: ['name'],
          });
        }
      }),
    [schema, msg.duplicateName, takenNames, editingName]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(resolvedSchema),
    defaultValues: {
      name: editingCategory?.name ?? prefill?.name ?? '',
      icon: editingCategory?.icon ?? prefill?.icon ?? parentCategory?.icon ?? '',
      color: editingCategory?.color ?? prefill?.color ?? parentCategory?.color ?? COLOR_PRESETS[0],
      // 자식 카테고리는 항상 부모의 구분을 따른다(부모가 잠금값으로 우선).
      subGroup: lockedSubGroup ?? editingCategory?.subGroup ?? subGroups[0],
      description: editingCategory?.description ?? prefill?.description ?? '',
      examples: editingCategory?.examples ?? prefill?.examples ?? [],
      recurrence: editingCategory?.recurrence
        ? {
            enabled: editingCategory.recurrence.enabled,
            kind: editingCategory.recurrence.kind,
            dayOfMonth: editingCategory.recurrence.dayOfMonth,
            week: editingCategory.recurrence.week,
            weekday: editingCategory.recurrence.weekday,
            leadDays: editingCategory.recurrence.leadDays,
            expectedAmount: editingCategory.recurrence.expectedAmount ?? null,
            intervalMonths: editingCategory.recurrence.intervalMonths,
            anchorMonth: editingCategory.recurrence.anchorMonth,
          }
        : (prefill?.recurrence ?? { enabled: false, kind: 'dayOfMonth' }),
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
          {title ??
            (editingCategory ? t('editTitle') : isChildMode ? t('addChildTitle') : t('addTitle'))}
        </SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5 overflow-y-auto overflow-x-hidden px-1 pb-6 pt-4"
        >
          {isChildMode && parentCategory && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('parent')}</Label>
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
                  {labels.subGroupShort(parentCategory.subGroup)}
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
                <FormLabel>{t('name')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={isChildMode ? t('namePlaceholderChild') : t('namePlaceholder')}
                    {...field}
                  />
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
                <FormLabel>{t('description')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('descriptionPlaceholder')} {...field} />
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
                <FormLabel>{t('examples')}</FormLabel>
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
                <FormLabel>{t('icon')}</FormLabel>
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
                  <FormLabel>{t('color')}</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!isChildMode && lockedSubGroupProp && (
            <div className="flex flex-col gap-1.5">
              <Label>{t('subGroup')}</Label>
              <div
                data-testid="locked-subgroup"
                className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                <span className="text-foreground">{labels.subGroup(lockedSubGroupProp)}</span>
                <Lock size={12} className="ml-auto" />
              </div>
            </div>
          )}

          {!isSubGroupLocked && (
            <FormField
              control={form.control}
              name="subGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('subGroup')}</FormLabel>
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
                            {labels.subGroup(sg as CategorySubGroup)}
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

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || form.formState.isSubmitting}
          >
            {isSubmitting || form.formState.isSubmitting ? t('saving') : t('save')}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
