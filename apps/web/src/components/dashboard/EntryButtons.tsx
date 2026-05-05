import Link from 'next/link';
import { Image as ImageIcon, BookOpen } from 'lucide-react';
import { Button } from '@uandi/ui';

export function EntryButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button asChild variant="outline" className="h-11 justify-start gap-2">
        <Link href="/photos" data-testid="photo-gallery-entry">
          <ImageIcon size={18} />
          <span>사진 갤러리</span>
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-11 justify-start gap-2">
        <Link href="/cashbook/history" data-testid="cashbook-entry">
          <BookOpen size={18} />
          <span>가계부</span>
        </Link>
      </Button>
    </div>
  );
}
