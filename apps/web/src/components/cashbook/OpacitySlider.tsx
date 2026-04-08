'use client';

import { Label, Slider } from '@uandi/ui';

type OpacitySliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function OpacitySlider({ value, onChange }: OpacitySliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>투명도</Label>
        <span className="text-sm text-muted-foreground">
          {Math.round(value * 100)}%
        </span>
      </div>
      <Slider
        min={0.1}
        max={1}
        step={0.05}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      <p className="text-xs text-muted-foreground">
        낮을수록 화면이 투명해집니다
      </p>
    </div>
  );
}
