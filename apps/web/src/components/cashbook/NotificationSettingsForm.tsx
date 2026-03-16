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
  Switch,
  Input,
  Button,
  Separator,
} from '@uandi/ui';

const DAY_LABELS = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

const notificationSettingsSchema = z.object({
  recordReminder: z.object({
    enabled: z.boolean(),
    time: z.string(),
    days: z.array(z.number()),
  }),
  budgetWarning: z.object({
    enabled: z.boolean(),
  }),
});

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

type NotificationSettingsFormProps = {
  defaultValues: NotificationSettingsFormValues;
  onSave: (data: NotificationSettingsFormValues) => void;
  isSaving: boolean;
};

export function NotificationSettingsForm({
  defaultValues,
  onSave,
  isSaving,
}: NotificationSettingsFormProps) {
  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues,
  });

  const reminderEnabled = useWatch({ control: form.control, name: 'recordReminder.enabled' });
  const selectedDays = useWatch({ control: form.control, name: 'recordReminder.days' });

  const toggleDay = (day: number) => {
    const current = form.getValues('recordReminder.days');
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    form.setValue('recordReminder.days', next);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        {/* 기록 알림 */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">기록 알림</h3>

          <FormField
            control={form.control}
            name="recordReminder.enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="text-sm">알림 받기</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="record-reminder-switch"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {reminderEnabled && (
            <div className="space-y-4 pl-1">
              <FormField
                control={form.control}
                name="recordReminder.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">시간</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        data-testid="reminder-time-input"
                        className="w-32"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div data-testid="day-selector">
                <span className="text-sm font-medium">요일 선택</span>
                <div className="flex gap-2 mt-2">
                  {DAY_LABELS.map(({ value, label }) => {
                    const isSelected = selectedDays.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        onClick={() => toggleDay(value)}
                        data-selected={isSelected}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* 예산 경고 알림 */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">예산 경고 알림</h3>

          <FormField
            control={form.control}
            name="budgetWarning.enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="text-sm">알림 받기</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="budget-warning-switch"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </form>
    </Form>
  );
}
