'use client';

import { useTranslations } from 'next-intl';
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

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;

const notificationSettingsSchema = z.object({
  recordReminder: z.object({
    enabled: z.boolean(),
    time: z.string(),
    days: z.array(z.number()),
  }),
  budgetWarning: z.object({
    enabled: z.boolean(),
    selfAlertInApp: z.boolean(),
  }),
  recurringTransaction: z.object({
    enabled: z.boolean(),
  }),
  recordRequest: z.object({
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
  const t = useTranslations('cashbook.notifications.form');
  const tRec = useTranslations('cashbook.recurrenceFields');
  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues,
  });

  const reminderEnabled = useWatch({ control: form.control, name: 'recordReminder.enabled' });
  const selectedDays = useWatch({ control: form.control, name: 'recordReminder.days' });
  const budgetWarningEnabled = useWatch({ control: form.control, name: 'budgetWarning.enabled' });

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
          <h3 className="text-base font-semibold">{t('reminderTitle')}</h3>

          <FormField
            control={form.control}
            name="recordReminder.enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="text-sm">{t('enable')}</FormLabel>
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
                    <FormLabel className="text-sm">{t('time')}</FormLabel>
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
                <span className="text-sm font-medium">{t('days')}</span>
                <div className="flex gap-2 mt-2">
                  {DAY_VALUES.map((value) => {
                    const label = tRec(`weekdayShort.${value}`);
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
          <h3 className="text-base font-semibold">{t('budgetTitle')}</h3>

          <FormField
            control={form.control}
            name="budgetWarning.enabled"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel className="text-sm">{t('enable')}</FormLabel>
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

          {budgetWarningEnabled && (
            <FormField
              control={form.control}
              name="budgetWarning.selfAlertInApp"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 pl-1">
                  <div className="space-y-1">
                    <FormLabel className="text-sm">{t('selfAlert')}</FormLabel>
                    <p className="text-xs text-muted-foreground">{t('selfAlertHint')}</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="budget-warning-self-in-app-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        {/* 고정 지출·수입 알림 */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">{t('recurringTitle')}</h3>

          <FormField
            control={form.control}
            name="recurringTransaction.enabled"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <FormLabel className="text-sm">{t('enable')}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t('recurringHint')}</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="recurring-transaction-switch"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* 입력 요청("콕 찌르기") 알림 */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">{t('nudgeTitle')}</h3>

          <FormField
            control={form.control}
            name="recordRequest.enabled"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <FormLabel className="text-sm">{t('enable')}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t('nudgeHint')}</p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="record-request-switch"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? t('saving') : t('save')}
        </Button>
      </form>
    </Form>
  );
}
