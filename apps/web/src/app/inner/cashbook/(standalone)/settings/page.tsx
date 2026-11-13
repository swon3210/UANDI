'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { ChevronRight } from 'lucide-react';
import { Header, Separator } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookDisplaySettings,
  useUpdateCashbookDisplaySettings,
  useCashbookOpacity,
} from '@/hooks/useCashbookDisplaySettings';
import { BackgroundImageUploader } from '@/components/cashbook/BackgroundImageUploader';
import { OpacitySlider } from '@/components/cashbook/OpacitySlider';
import { FloatingBubbleToggle } from '@/components/cashbook/FloatingBubbleToggle';
import { BackButton } from '@/components/shell/BackButton';

export default function CashbookSettingsPage() {
  const t = useTranslations('cashbook.settings');
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;

  const { data: displaySettings } = useCashbookDisplaySettings(uid);
  const updateMutation = useUpdateCashbookDisplaySettings(uid);
  const [opacity, setOpacity] = useCashbookOpacity();

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={t('title')} leftSlot={<BackButton />} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">{t('manage')}</h2>
          <Link
            href="/inner/cashbook/plan/annual"
            data-testid="settings-link-annual-plan"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            {t('goals')}
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          <Link
            href="/inner/cashbook/categories"
            data-testid="settings-link-categories"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            {t('categories')}
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          <Link
            href="/inner/cashbook/history/weekly/notifications"
            data-testid="settings-link-notifications"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            {t('notifications')}
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          {/* 모바일 네이티브(안드로이드)에서만 보인다 — 그 외엔 null. */}
          <FloatingBubbleToggle />
        </section>

        <Separator className="my-6" />

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">{t('background')}</h2>
          {uid && (
            <BackgroundImageUploader
              userId={uid}
              currentImageUrl={displaySettings?.backgroundImageUrl ?? null}
              onUploaded={(url) => updateMutation.mutate({ backgroundImageUrl: url })}
              onRemoved={() => updateMutation.mutate({ backgroundImageUrl: null })}
            />
          )}
        </section>

        <Separator className="my-6" />

        <section className="space-y-3">
          <OpacitySlider value={opacity} onChange={setOpacity} />
        </section>
      </main>
    </div>
  );
}
