// 인앱 이미지/파일 피커가 떠 있는 동안 플로팅 버블이 그 위에 그려지지 않도록 하는 신호.
//
// 웹의 <input type=file>을 누르면 OS 피커가 별도 액티비티로 떠 앱이 잠깐 백그라운드로 가고,
// 그 사이 AppState 변화로 버블이 표시되는 문제가 있다(내역 페이지 AI 첨부, 갤러리 업로드 등 모든 첨부).
// app-webview가 주입한 click 후킹으로 'file-picker-open' 메시지를 받으면 markOpen()을 호출하고,
// use-floating-bubble은 백그라운드 전환 시 isActive()면 show()를 건너뛴다.
//
// TTL을 두는 이유: 피커가 실제로 안 열리는(또는 취소된) 경우 신호가 영구히 남아
// 다음의 정상적인 백그라운드 진입에서 버블이 안 뜨는 일을 막는다. 피커가 열려 있는 동안엔
// 앱이 계속 백그라운드라 show 시도 자체가 없으므로 짧은 TTL로 충분하다.

const PICKER_TTL_MS = 8000;

let openedAt = 0;

export const bubblePicker = {
  markOpen() {
    openedAt = Date.now();
  },
  clear() {
    openedAt = 0;
  },
  isActive() {
    return openedAt > 0 && Date.now() - openedAt < PICKER_TTL_MS;
  },
};
