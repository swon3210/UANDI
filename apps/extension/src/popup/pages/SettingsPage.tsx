import { useEffect } from 'react';
import { Button, Separator } from '@uandi/ui';
import { X } from 'lucide-react';
import { useCashbookOpacity } from '@/hooks/useCashbookOpacity';
import { usePageOpacity } from '@/hooks/usePageOpacity';
import { applyPageOpacityToActiveTab } from '@/lib/pageOpacity';
import { OpacitySlider } from '../components/OpacitySlider';

type SettingsPageProps = {
  onClose: () => void;
};

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [opacity, setOpacity] = useCashbookOpacity();
  const [pageOpacity, setPageOpacity] = usePageOpacity();

  // 팝업이 열릴 때 저장된 값을 현재 탭에 한 번 동기화 (탭 DOM = 외부 시스템)
  useEffect(() => {
    if (pageOpacity !== 1) {
      void applyPageOpacityToActiveTab(pageOpacity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageOpacityChange = (value: number) => {
    setPageOpacity(value);
    void applyPageOpacityToActiveTab(value);
  };

  const handleResetPageOpacity = () => {
    setPageOpacity(1);
    void applyPageOpacityToActiveTab(1);
  };

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
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-6">
        <OpacitySlider value={opacity} onChange={setOpacity} label="팝업 투명도" />

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">현재 탭 투명도</span>
            <Button variant="ghost" size="sm" onClick={handleResetPageOpacity}>
              초기화
            </Button>
          </div>
          <OpacitySlider
            value={pageOpacity}
            onChange={handlePageOpacityChange}
            label="웹페이지 투명도"
            description="현재 보고 있는 웹페이지 전체의 투명도를 조절합니다. 새로고침 시 초기화됩니다."
          />
        </div>
      </div>
    </div>
  );
}
