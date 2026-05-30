'use client';

import { Button } from '../../components/button';
import { Label } from '../../components/label';
import { Slider } from '../../components/slider';
import { cn } from '../../lib/utils';

export type AssetAllocationBucket = 'savings' | 'stocks' | 'realEstate' | 'crypto' | 'forex';

export type AssetAllocationValue = {
  savings: number;
  stocks: number;
  realEstate: number;
  crypto: number;
  forex: number;
};

export type AssetAllocationEditorProps = {
  value: AssetAllocationValue;
  onChange: (value: AssetAllocationValue) => void;
  onSave?: () => void;
  isSaving?: boolean;
  className?: string;
};

const BUCKETS: { key: AssetAllocationBucket; label: string; barClass: string }[] = [
  { key: 'savings', label: '예적금', barClass: 'bg-emerald-500' },
  { key: 'stocks', label: '주식', barClass: 'bg-indigo-500' },
  { key: 'realEstate', label: '부동산', barClass: 'bg-amber-500' },
  { key: 'crypto', label: '코인', barClass: 'bg-fuchsia-500' },
  { key: 'forex', label: '외환', barClass: 'bg-sky-500' },
];

const STEP = 5;

export function AssetAllocationEditor({
  value,
  onChange,
  onSave,
  isSaving = false,
  className,
}: AssetAllocationEditorProps) {
  const total = BUCKETS.reduce((sum, { key }) => sum + value[key], 0);
  const isValid = total === 100;

  const handleSliderChange = (key: AssetAllocationBucket, next: number) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className={cn('space-y-6', className)} data-testid="asset-allocation-editor">
      {/* 비율 미리보기 막대 */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        data-testid="allocation-preview-bar"
      >
        {BUCKETS.map(({ key, barClass }) => (
          <div
            key={key}
            className={cn('h-full transition-[width]', barClass)}
            style={{ width: `${Math.min(value[key], 100)}%` }}
          />
        ))}
      </div>

      {/* 버킷별 슬라이더 */}
      <div className="space-y-5">
        {BUCKETS.map(({ key, label, barClass }) => (
          <div key={key} className="space-y-2" data-testid={`allocation-row-${key}`}>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', barClass)} aria-hidden />
                {label}
              </Label>
              <span
                className="text-sm font-medium tabular-nums"
                data-testid={`allocation-value-${key}`}
              >
                {value[key]}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={STEP}
              value={[value[key]]}
              onValueChange={([v]) => handleSliderChange(key, v)}
              aria-label={`${label} 비율`}
            />
          </div>
        ))}
      </div>

      {/* 합계 + 저장 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">합계</span>
          <span
            className={cn(
              'font-semibold tabular-nums',
              isValid ? 'text-emerald-600' : 'text-destructive'
            )}
            data-testid="allocation-total"
          >
            {total}%
          </span>
        </div>
        {!isValid && (
          <p className="text-xs text-destructive" data-testid="allocation-total-warning">
            모든 항목의 합이 100%가 되어야 저장할 수 있어요.
          </p>
        )}
        {onSave && (
          <Button
            type="button"
            className="w-full"
            disabled={!isValid || isSaving}
            onClick={onSave}
            data-testid="allocation-save"
          >
            {isSaving ? '저장 중…' : '저장'}
          </Button>
        )}
      </div>
    </div>
  );
}
