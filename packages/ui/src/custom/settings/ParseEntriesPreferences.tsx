'use client';

import { useState } from 'react';
import { useTranslations } from 'use-intl';
import { Plus, X } from 'lucide-react';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/select';
import { PreferenceSection } from './PreferenceSection';
import {
  MAX_CATEGORY_RULES,
  MAX_RULE_MATCH_LEN,
  MAX_TRANSFER_KEYWORDS,
  MAX_TRANSFER_KEYWORD_LEN,
  type CategoryRule,
  type ParseEntriesPrefs,
} from './aiPreferences';

export type ParseEntriesPreferencesProps = {
  value: ParseEntriesPrefs;
  onChange: (value: ParseEntriesPrefs) => void;
  /** 커플 카테고리 이름들 — 규칙의 목적지 카테고리 선택지. */
  categories: string[];
  disabled?: boolean;
};

/** 한 줄 키워드로 정규화(개행/양끝 공백 제거 + 길이 캡). 서버가 최종 sanitize 하지만 UI에서도 막는다. */
function normalizeKeyword(raw: string, maxLen: number): string {
  return raw
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * C. 거래 파싱 맞춤화 — 가맹점/키워드 → 카테고리 매핑 규칙 + 이체로 볼 키워드.
 *
 * 자유 텍스트(`match`/이체 키워드)가 들어가는 유일한 섹션. 방어:
 *  - category 는 커플 카테고리에서만 선택(enum 제약)
 *  - match/키워드는 개행 제거 + 길이 캡(MAX_RULE_MATCH_LEN / MAX_TRANSFER_KEYWORD_LEN)
 *  - 규칙/키워드 개수 캡(MAX_CATEGORY_RULES / MAX_TRANSFER_KEYWORDS)
 *  서버가 동일 규칙으로 재검증하고, 파싱 결과는 기존 Zod + 사용자 확인 단계를 거친다.
 */
export function ParseEntriesPreferences({
  value,
  onChange,
  categories,
  disabled,
}: ParseEntriesPreferencesProps) {
  const t = useTranslations('ui.aiPrefs.parse');
  const [newKeyword, setNewKeyword] = useState('');

  const hasCategories = categories.length > 0;
  const canAddRule = !disabled && hasCategories && value.categoryRules.length < MAX_CATEGORY_RULES;

  const updateRule = (index: number, patch: Partial<CategoryRule>) => {
    const next = value.categoryRules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule));
    onChange({ ...value, categoryRules: next });
  };

  const addRule = () => {
    if (!canAddRule) return;
    onChange({
      ...value,
      categoryRules: [...value.categoryRules, { match: '', category: categories[0] ?? '' }],
    });
  };

  const removeRule = (index: number) => {
    onChange({ ...value, categoryRules: value.categoryRules.filter((_, i) => i !== index) });
  };

  const addKeyword = () => {
    const keyword = normalizeKeyword(newKeyword, MAX_TRANSFER_KEYWORD_LEN);
    if (!keyword) return;
    if (value.transferKeywords.includes(keyword)) {
      setNewKeyword('');
      return;
    }
    if (value.transferKeywords.length >= MAX_TRANSFER_KEYWORDS) return;
    onChange({ ...value, transferKeywords: [...value.transferKeywords, keyword] });
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    onChange({
      ...value,
      transferKeywords: value.transferKeywords.filter((k) => k !== keyword),
    });
  };

  return (
    <PreferenceSection
      title={t('title')}
      description={t('description')}
      enabled={value.enabled}
      onEnabledChange={(enabled) => onChange({ ...value, enabled })}
      enabledTestId="ai-parse-enabled"
      disabled={disabled}
    >
      {/* 가맹점/키워드 → 카테고리 규칙 */}
      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="text-sm font-medium">{t('rulesLegend')}</legend>
        {!hasCategories ? (
          <p className="text-xs text-muted-foreground">{t('needCategories')}</p>
        ) : null}

        {value.categoryRules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              data-testid={`ai-parse-rule-${index}-match`}
              value={rule.match}
              maxLength={MAX_RULE_MATCH_LEN}
              placeholder={t('matchPlaceholder')}
              onChange={(e) => updateRule(index, { match: e.target.value.replace(/[\r\n]/g, '') })}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <Select
              value={rule.category}
              onValueChange={(category) => updateRule(index, { category })}
            >
              <SelectTrigger
                data-testid={`ai-parse-rule-${index}-category`}
                className="w-28 shrink-0"
              >
                <SelectValue placeholder={t('categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('removeRule')}
              data-testid={`ai-parse-rule-${index}-remove`}
              onClick={() => removeRule(index)}
            >
              <X size={16} />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="ai-parse-add-rule"
          onClick={addRule}
          disabled={!canAddRule}
        >
          <Plus size={16} className="mr-1" />
          {t('addRule')}
        </Button>
        {value.categoryRules.length >= MAX_CATEGORY_RULES ? (
          <p className="text-xs text-muted-foreground">
            {t('maxRules', { max: MAX_CATEGORY_RULES })}
          </p>
        ) : null}
      </fieldset>

      {/* 이체로 볼 키워드 */}
      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">{t('transferLegend')}</legend>
        <p className="text-xs text-muted-foreground">{t('transferHint')}</p>
        <div className="flex items-center gap-2">
          <Input
            data-testid="ai-parse-transfer-input"
            value={newKeyword}
            maxLength={MAX_TRANSFER_KEYWORD_LEN}
            placeholder={t('transferPlaceholder')}
            onChange={(e) => setNewKeyword(e.target.value.replace(/[\r\n]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="ai-parse-transfer-add"
            onClick={addKeyword}
            disabled={disabled || value.transferKeywords.length >= MAX_TRANSFER_KEYWORDS}
          >
            {t('add')}
          </Button>
        </div>
        {value.transferKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {value.transferKeywords.map((keyword) => (
              <span
                key={keyword}
                data-testid={`ai-parse-transfer-chip-${keyword}`}
                className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-xs"
              >
                {keyword}
                <button
                  type="button"
                  aria-label={t('removeKeyword', { keyword })}
                  data-testid={`ai-parse-transfer-remove-${keyword}`}
                  onClick={() => removeKeyword(keyword)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </fieldset>
    </PreferenceSection>
  );
}
