import { Button } from '@uandi/ui';
import { X } from 'lucide-react';
import { useCashbookOpacity } from '@/hooks/useCashbookOpacity';
import { OpacitySlider } from '../components/OpacitySlider';

type SettingsPageProps = {
  onClose: () => void;
};

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [opacity, setOpacity] = useCashbookOpacity();

  return (
    <div className="relative flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <span className="text-sm font-semibold">디스플레이 설정</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        <OpacitySlider value={opacity} onChange={setOpacity} />
      </div>
    </div>
  );
}
