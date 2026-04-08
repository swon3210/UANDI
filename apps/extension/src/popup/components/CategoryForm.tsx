import { useState } from 'react';
import { Input, Button, Label } from '@uandi/ui';
import {
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_LABELS,
  COLOR_PRESETS,
} from '@uandi/cashbook-core';
import type { CashbookCategory, CategoryGroup, CategorySubGroup } from '@uandi/cashbook-core';
import { IconPicker } from './IconPicker';
import { ColorPicker } from './ColorPicker';

type FormValues = {
  name: string;
  icon: string;
  color: string;
  subGroup: string;
};

type CategoryFormProps = {
  group: CategoryGroup;
  editingCategory?: CashbookCategory;
  onSubmit: (data: FormValues) => Promise<void>;
  onClose: () => void;
};

export function CategoryForm({ group, editingCategory, onSubmit, onClose }: CategoryFormProps) {
  const subGroups = SUB_GROUPS_BY_GROUP[group];

  const [name, setName] = useState(editingCategory?.name ?? '');
  const [icon, setIcon] = useState(editingCategory?.icon ?? '');
  const [color, setColor] = useState(editingCategory?.color ?? COLOR_PRESETS[0]);
  const [subGroup, setSubGroup] = useState(editingCategory?.subGroup ?? subGroups[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = '카테고리 이름을 입력해주세요';
    if (!icon) newErrors.icon = '아이콘을 선택해주세요';
    if (!subGroup) newErrors.subGroup = '구분을 선택해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), icon, color, subGroup });
      onClose();
    } catch {
      // mutation onError에서 toast 처리
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-1 pb-4 pt-2">
      <div className="space-y-1.5">
        <Label>이름</Label>
        <Input
          placeholder="예: 정기급여"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>아이콘</Label>
        <IconPicker value={icon} onChange={setIcon} />
        {errors.icon && <p className="text-xs text-destructive">{errors.icon}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>색상</Label>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="space-y-1.5">
        <Label>구분</Label>
        <div className="flex flex-wrap gap-2">
          {subGroups.map((sg) => (
            <button
              key={sg}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                subGroup === sg
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border hover:bg-accent'
              }`}
              onClick={() => setSubGroup(sg)}
            >
              {SUB_GROUP_LABELS[sg as CategorySubGroup]}
            </button>
          ))}
        </div>
        {errors.subGroup && <p className="text-xs text-destructive">{errors.subGroup}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        저장
      </Button>
    </form>
  );
}
