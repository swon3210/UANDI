'use client';

import { Suspense } from 'react';
import { FullScreenSpinner } from '@uandi/ui';
import { PhotosGallery } from '@/components/photos/PhotosGallery';

export default function PhotosPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <PhotosGallery />
    </Suspense>
  );
}
