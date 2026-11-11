'use client';

import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@uandi/ui';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/locale';

export type LanguageSettingRowProps = {
  value: Locale;
  onChange: (locale: Locale) => void;
  /** 전환 반영 중(router.refresh) 이면 셀렉트를 잠근다 */
  disabled?: boolean;
};

/** 설정 첫 화면의 "언어" 행. 언어 이름은 해당 언어로 고정 표기한다(한국어 / English). */
export function LanguageSettingRow({ value, onChange, disabled }: LanguageSettingRowProps) {
  const t = useTranslations('settings.language');

  return (
    <div
      data-testid="settings-language"
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Languages size={20} className="shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{t('label')}</span>
          <span className="text-xs text-muted-foreground">{t('description')}</span>
        </div>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as Locale)} disabled={disabled}>
        <SelectTrigger
          data-testid="settings-language-select"
          aria-label={t('selectAriaLabel')}
          className="w-[7.5rem] shrink-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LOCALES.map((locale) => (
            <SelectItem
              key={locale}
              value={locale}
              data-testid={`settings-language-option-${locale}`}
            >
              {LOCALE_LABELS[locale]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
