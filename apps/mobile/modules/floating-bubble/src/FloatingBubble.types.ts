// 사용자가 버블을 휴지통에 떨어뜨려 끌 때 발생하는 이벤트.
export type FloatingBubbleEvents = {
  onDismiss: () => void;
};

export type FloatingBubbleSubscription = { remove(): void };

// Android 전용 플로팅 버블 네이티브 모듈의 타입.
export type FloatingBubbleModuleType = {
  // '다른 앱 위에 표시' 권한 보유 여부.
  hasOverlayPermission(): boolean;
  // 권한 설정 화면을 연다.
  requestOverlayPermission(): void;
  // 버블을 화면에 띄운다(권한 없거나 꺼져 있거나 이미 표시 중이면 무시).
  show(): void;
  // 버블을 제거한다(확장된 상태에선 무시).
  hide(): void;
  // 버블 기능 on/off 여부(사용자가 끄면 false). 단일 소스는 네이티브 SharedPreferences.
  isEnabled(): boolean;
  // 버블 기능 켜기/끄기. 끄면 즉시 화면에서 제거된다.
  setEnabled(enabled: boolean): void;
  // 휴지통으로 끈 시점을 구독한다(설정 UI 상태 동기화용).
  addListener<E extends keyof FloatingBubbleEvents>(
    eventName: E,
    listener: FloatingBubbleEvents[E]
  ): FloatingBubbleSubscription;
  removeAllListeners(eventName: keyof FloatingBubbleEvents): void;
};
