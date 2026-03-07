import { Loader2 } from 'lucide-react';
import { cn } from '@uandi/ui/lib/utils';

type FullScreenSpinnerProps = {
  className?: string;
};

export function FullScreenSpinner({ className }: FullScreenSpinnerProps) {
  return (
    <div className={cn('flex min-h-screen items-center justify-center', className)}>
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}
