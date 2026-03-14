'use client';

import { use } from 'react';
import { PhotoDetailView } from '@/components/photos/PhotoDetailView';

export default function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <PhotoDetailView photoId={id} />;
}
