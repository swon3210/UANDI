'use client';

import { Suspense } from 'react';
import { PhotosGallery } from '@/components/photos/PhotosGallery';
import { MascotLoader } from '@/components/MascotLoader';

export default function PhotosPage() {
  return (
    <Suspense fallback={<MascotLoader fullScreen />}>
      <PhotosGallery />
    </Suspense>
  );
}
