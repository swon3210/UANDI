'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Slider,
} from '@uandi/ui';
import { getCroppedBlob } from '@/utils/crop-image';

export type ProfileAvatarCropperProps = {
  /** 크롭할 원본 이미지의 object URL. */
  imageSrc: string;
  isOpen: boolean;
  onCancel: () => void;
  /** 정사각형으로 잘린 이미지 파일. */
  onCropped: (file: File) => void;
};

export function ProfileAvatarCropper({
  imageSrc,
  isOpen,
  onCancel,
  onCropped,
}: ProfileAvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setAreaPixels(areaPx);
  }, []);

  const handleApply = async () => {
    if (!areaPixels) return;
    try {
      setProcessing(true);
      const blob = await getCroppedBlob(imageSrc, areaPixels);
      onCropped(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="avatar-cropper" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>사진 편집</DialogTitle>
          <DialogDescription className="sr-only">
            프로필 사진을 정사각형으로 자릅니다. 드래그로 위치를, 슬라이더로 확대를 조절하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="px-1 pt-1">
          <Slider
            data-testid="avatar-crop-zoom"
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={([z]) => setZoom(z)}
            aria-label="확대"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            data-testid="avatar-crop-cancel"
          >
            취소
          </Button>
          <Button
            onClick={handleApply}
            disabled={!areaPixels || processing}
            data-testid="avatar-crop-apply"
          >
            {processing ? '처리 중...' : '적용'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
