'use client';

import { useEffect } from 'react';
import { useCashbookOpacity } from '@/hooks/useCashbookDisplaySettings';

export function CashbookOpacityStyle() {
  const [opacity] = useCashbookOpacity();

  useEffect(() => {
    const doc = document.documentElement.style;
    doc.setProperty('--cashbook-opacity', String(opacity));
    if (opacity < 1) {
      doc.setProperty('--cashbook-overlay-bg', 'white');
    } else {
      doc.removeProperty('--cashbook-overlay-bg');
    }
    return () => {
      doc.removeProperty('--cashbook-opacity');
      doc.removeProperty('--cashbook-overlay-bg');
    };
  }, [opacity]);

  return null;
}
