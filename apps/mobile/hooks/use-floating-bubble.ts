import { useEffect, useRef } from 'react';
import { Alert, AppState, type AppStateStatus, Platform } from 'react-native';
import FloatingBubble from '@/modules/floating-bubble';
import { bubblePicker } from '@/lib/bubble-picker';

// 다른 앱 위에 떠 있는 말랑 가계부 플로팅 버블을 앱 생명주기에 맞춰 제어한다.
//  - 앱이 포그라운드(active)면 버블을 숨긴다(앱 안에서는 불필요).
//  - 앱이 백그라운드/비활성이면 버블을 띄운다(다른 앱 위에 표시).
// 버블은 '다른 앱 위에 표시'(SYSTEM_ALERT_WINDOW) 권한이 있어야 그려진다.
// 권한이 없으면 이유를 설명하는 안내 다이얼로그를 띄우고 설정으로 안내한다. Android 전용.
export function useFloatingBubble() {
  const askedRef = useRef(false);
  const grantedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const bubble = FloatingBubble;
    if (!bubble) return;

    grantedRef.current = bubble.hasOverlayPermission();

    // 권한이 없을 때만, 한 세션에 1회 이유를 설명하고 설정으로 안내한다(갑작스런 설정 이동 방지).
    const promptPermission = () => {
      if (askedRef.current || grantedRef.current) return;
      askedRef.current = true;
      Alert.alert(
        '플로팅 버블 켜기',
        "다른 앱을 사용하는 중에도 말랑 가계부 빠른 추가 버블을 띄우려면 '다른 앱 위에 표시' 권한이 필요해요.",
        [
          { text: '나중에', style: 'cancel' },
          { text: '권한 설정 열기', onPress: () => bubble.requestOverlayPermission() },
        ]
      );
    };

    promptPermission();

    // 사용자가 휴지통으로 버블을 끄면 한 번 안내(다시 켜는 경로를 알려준다).
    const dismissSub = bubble.addListener?.('onDismiss', () => {
      Alert.alert('플로팅 버블을 제거했어요', '가계부 설정에서 다시 켤 수 있어요.');
    });

    const sync = (state: AppStateStatus) => {
      const granted = bubble.hasOverlayPermission();

      // 설정에서 막 허용하고 돌아온 경우 한 번 확인 안내.
      if (granted && !grantedRef.current) {
        grantedRef.current = true;
        Alert.alert('플로팅 버블이 켜졌어요', '다른 앱으로 이동하면 화면 우하단에 버블이 나타나요.');
      }

      if (!granted) {
        grantedRef.current = false;
        // 설정에서 허용하지 않고 돌아왔다면(앱 복귀 시) 한 번 더 안내한다.
        if (state === 'active') promptPermission();
        return;
      }

      if (state === 'active') {
        // 앱으로 복귀 → 피커가 닫혔다고 보고 신호를 비운다.
        bubblePicker.clear();
        bubble.hide();
        return;
      }

      // 백그라운드 전환 시점에 동기로 show()를 호출한다.
      // (백그라운드에서는 RN JS 타이머가 정지/스로틀되므로 setTimeout으로 미루면 버블이 영영 안 뜬다.)
      // 인앱 피커 때문에 잠깐 백그라운드로 간 경우엔 띄우지 않는다 — 'file-picker-open' 메시지는
      // 클릭 시점에 큐잉되어 이 백그라운드 이벤트보다 먼저 처리되므로 동기 검사로 충분하다.
      if (bubblePicker.isActive()) return;
      bubble.show();
    };

    const sub = AppState.addEventListener('change', sync);

    return () => {
      sub.remove();
      dismissSub?.remove();
      bubble.hide();
    };
  }, []);
}
