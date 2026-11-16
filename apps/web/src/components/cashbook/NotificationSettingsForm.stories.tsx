import type { Meta, StoryObj } from '@storybook/react';
import { NotificationSettingsForm } from './NotificationSettingsForm';

const meta: Meta<typeof NotificationSettingsForm> = {
  title: 'Cashbook/NotificationSettingsForm',
  component: NotificationSettingsForm,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof NotificationSettingsForm>;

export const Default: Story = {
  args: {
    defaultValues: {
      recordReminder: {
        enabled: false,
        time: '21:00',
        days: [1, 2, 3, 4, 5],
      },
      budgetWarning: {
        enabled: true,
        selfAlertInApp: true,
      },
      recurringTransaction: { enabled: true },
      recordRequest: { enabled: true },
      announcement: { enabled: true },
    },
    onSave: (data) => console.log('save', data),
    isSaving: false,
  },
};

export const AllEnabled: Story = {
  args: {
    defaultValues: {
      recordReminder: {
        enabled: true,
        time: '20:00',
        days: [1, 3, 5],
      },
      budgetWarning: {
        enabled: true,
        selfAlertInApp: true,
      },
      recurringTransaction: { enabled: true },
      recordRequest: { enabled: true },
      announcement: { enabled: true },
    },
    onSave: (data) => console.log('save', data),
    isSaving: false,
  },
};

export const SelfInAppOff: Story = {
  name: '본인 in-app 알림 OFF',
  args: {
    defaultValues: {
      recordReminder: {
        enabled: false,
        time: '21:00',
        days: [1, 2, 3, 4, 5],
      },
      budgetWarning: {
        enabled: true,
        selfAlertInApp: false,
      },
      recurringTransaction: { enabled: true },
      recordRequest: { enabled: true },
      announcement: { enabled: true },
    },
    onSave: (data) => console.log('save', data),
    isSaving: false,
  },
};

export const Saving: Story = {
  args: {
    defaultValues: {
      recordReminder: {
        enabled: true,
        time: '21:00',
        days: [1, 2, 3, 4, 5],
      },
      budgetWarning: {
        enabled: true,
        selfAlertInApp: true,
      },
      recurringTransaction: { enabled: true },
      recordRequest: { enabled: true },
      announcement: { enabled: true },
    },
    onSave: (data) => console.log('save', data),
    isSaving: true,
  },
};

/** 공지 알림(어드민 공지 푸시)을 끈 상태 */
export const AnnouncementOff: Story = {
  args: {
    defaultValues: {
      recordReminder: { enabled: false, time: '21:00', days: [1, 2, 3, 4, 5] },
      budgetWarning: { enabled: true, selfAlertInApp: true },
      recurringTransaction: { enabled: true },
      recordRequest: { enabled: true },
      announcement: { enabled: false },
    },
    onSave: (data) => console.log('save', data),
    isSaving: false,
  },
};
