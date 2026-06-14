// Android 전용 플로팅 버블 네이티브 모듈의 타입.
export type FloatingBubbleModuleType = {
  // '다른 앱 위에 표시' 권한 보유 여부.
  hasOverlayPermission(): boolean;
  // 권한 설정 화면을 연다.
  requestOverlayPermission(): void;
  // 버블을 화면에 띄운다(권한 없거나 이미 표시 중이면 무시).
  show(): void;
  // 버블을 제거한다.
  hide(): void;
};
