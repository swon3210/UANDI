'use client';

import { CATEGORY_ICON_MAP } from '@/constants/category-icons';

type CategoryIconProps = {
  name: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
};

export function CategoryIcon({
  name,
  size = 20,
  color,
  weight = 'duotone',
}: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[name];
  if (!Icon) return <span className="text-base">{name}</span>;
  return <Icon size={size} color={color} weight={weight} />;
}
