---
title: '뒤로가기 한 번에 서비스가 닫히던 문제, 그리고 우리가 정한 네비게이션 정책'
date: '2026-09-16'
summary: '딥링크로 진입한 유저가 뒤로가기 한 번에 이탈하던 문제를 파다 보니, 뒤로가기와 나가기의 동작이 정의된 적이 없었다. 브라우저가 무엇을 막는지부터 정리하고 세 가지 정책을 정했다.'
category: 'tech-decision'
tags: ['웹뷰', '브라우저', '네비게이션']
draft: false
---

## 문제

현재 담당하는 서비스는 인앱 웹뷰로 동작한다. 유저 대부분은 알림톡이나 앱푸시의 딥링크로 유입되는데, 이 유저들에게서 **뒤로가기 한 번에 서비스 밖으로 이탈하는** 현상이 반복됐다. 앱 안에서 진입점을 찾기 어려운 서비스라 한 번 나가면 사실상 세션이 끝나고, 그 세션에서 일어났어야 할 전환 액션이 통째로 사라진다.

![딥링크로 진입한 유저가 뒤로가기 한 번에 서비스 밖으로 이탈하는 흐름](/images/posts/navigation-policy/01-deeplink-back-exit.png)

이 현상은 갑자기 생긴 버그가 아니다. 서비스를 만들어오며 네비게이션 주변에 쌓인 기술부채가 딥링크 유입이 늘면서 드러난 것이다. 정리하면 세 가지다.

1. 딥링크 진입 후 뒤로가기를 누르면 웹뷰 모달이 통째로 닫힌다.
2. 팝업·바텀시트가 뒤로가기로 닫히는지가 화면마다, 앱과 웹에서 다르다. 모바일 유저는 팝업을 닫으려고 뒤로가기를 누르는 습관이 있어서 이 불일치가 곧 이탈이 된다.
3. '나가기' 버튼이 웹에서는 no-op이다.

셋의 뿌리는 하나다. **뒤로가기와 나가기의 동작을 정의한 적이 없다.** 앱에서는 브릿지 인터페이스로 뒤로가기를 확실하게 제어할 수 있고, 웹에서는 브라우저가 허용하는 범위 안에서만 가능하다. 어느 쪽 제어권을 기준으로 삼을지 정하지 않았으니 화면마다 그때그때 가능한 방식으로 구현됐고, "버그인가 스펙인가"부터 매번 헷갈렸다.

그래서 1번만 고치는 대신 팀에 뒤로가기·나가기 정책을 먼저 정리하자고 제안했다. 정책이 서야 세 부채를 한 번에 정리할 수 있고, 그래야 딥링크 이탈도 재발 없이 해결된다. 정책을 정하려면 브라우저가 무엇을 허용하고 무엇을 막는지부터 정확히 알아야 했다.

## 배경 지식

### 뒤로가기는 세션 히스토리를 한 칸 되돌리는 것이다

딥링크로 진입한 유저는 히스토리 스택이 비어 있다. 도착한 페이지가 첫 엔트리다. 되돌아갈 엔트리가 없으면 뒤로가기는 웹뷰를 지나 네이티브로 넘어가고, 앱은 이를 "모달 닫기"로 처리한다. 확인 결과 앱이 뒤로가기를 가로채는 게 아니었다. 하드웨어 백 버튼과 스와이프 백 모두 웹뷰의 `canGoBack()`을 따르고, **false일 때만** 모달을 닫는다. 문제 1의 원인은 앱이 아니라 빈 히스토리였다.

![일반 유입과 딥링크 유입의 히스토리 스택 비교](/images/posts/navigation-policy/02-history-stack.png)

### pushState로 엔트리를 쌓을 수는 있지만, 브라우저가 건너뛸 수 있다

웹에서 뒤로가기를 다루는 방법은 하나다. `history.pushState`로 엔트리를 하나 쌓고, 유저가 뒤로가기로 그 엔트리에 내려오는 `popstate`를 잡아 원하는 동작을 실행하는 것.

브라우저는 이 패턴을 경계한다. 뒤로가기를 무력화하는 사이트가 많았기 때문에 Chromium에는 **history manipulation intervention**이 있다. user activation 없이 추가된 엔트리는 뒤로가기 UI에서 스킵된다. 진입 직후 자동으로 심는 기준점 엔트리가 정확히 이 케이스다.

잘 알려지지 않은 규칙이 하나 더 있다. **document가 user activation을 한 번이라도 받으면 그 document의 same-document 엔트리가 전부 non-skippable로 바뀐다.** 유저가 화면을 한 번 탭하면 그 전에 심은 기준점도 살아난다는 뜻이다. 취약한 건 "진입 후 아무것도 탭하지 않고 뒤로가기를 누른 유저"뿐이다. 단, 스크롤은 activation이 아니다. 공지를 스크롤로만 읽고 나가는 유저는 여전히 이탈한다. 그리고 이건 Chromium 규칙이라 iOS WKWebView에서는 동작이 다를 수 있다.

![진입 직후에는 기준점 엔트리가 스킵되지만, 한 번 탭한 뒤에는 유효해진다](/images/posts/navigation-policy/03-intervention.png)

### window.close()의 조건은 opener만이 아니다

`window.close()`는 흔히 "스크립트로 연 창만 닫을 수 있다"고 알려져 있지만 절반만 맞다. HTML 스펙과 Chrome, Firefox, Safari 모두 **세션 히스토리가 하나뿐인 탭**도 닫을 수 있게 허용한다. 외부 앱에서 링크를 눌러 새 탭이 열린 경우를 위한 예외다.

그런데 우리 서비스의 웹 진입은 왜 닫히지 않았을까. 원인은 트래킹 링크였다. 에어브릿지류 트래킹 링크는 랜딩 페이지를 먼저 열고, 거기서 JS로 커스텀 스킴이나 인텐트를 시도한 뒤 실패하면 웹 URL로 `location.href` 리다이렉트한다. 이 랜딩 페이지가 히스토리에 한 엔트리로 남는다. 우리 페이지에 도착한 시점에 이미 `history.length >= 2`이고, 그래서 닫을 수 없는 것이다. 처음에는 "브라우저 정책상 원래 불가"라고 생각했는데, 정확한 이유는 "리다이렉트가 히스토리를 남겨서"였다. 이유가 정확해야 한다. 트래킹 링크의 폴백 방식이 바뀌면 결론도 바뀐다.

![트래킹 링크의 랜딩 페이지가 히스토리에 한 엔트리로 남아 window.close()가 막히는 구조](/images/posts/navigation-policy/04-tracking-link.png)

하나 더, Safari는 `target="_blank"`로 열린 새 탭에서도 `history.length`가 2다. 원래 탭을 가상의 이전 엔트리처럼 취급하기 때문이다. 따라서 `history.length === 1`로 닫힘 가능 여부를 미리 판정하는 코드는 신뢰할 수 없다. **`window.close()`를 호출한 뒤 `window.closed`를 확인하는 쪽**이 브라우저 차이에 덜 흔들린다.

### window.open도 user activation에 묶여 있다

덤으로 알게 된 것. 팝업 차단, 히스토리 스킵, 창 닫기 정책은 모두 user activation이라는 하나의 모델 위에 있다. transient activation은 Chromium과 Firefox에서 약 5초 유지되고, Safari는 시간보다 "같은 이벤트 핸들러 태스크 안인가"에 가깝게 판단해서 `await` 뒤의 `window.open`이 막히는 경우가 많다. API 응답을 기다린 뒤 결제창을 여는 코드가 있다면, 클릭 즉시 빈 창을 열고 응답이 오면 `location`을 바꾸는 방식이 안전하다.

## 결정

세 결정 모두 같은 저울로 재기로 했다. 환경별 최적화냐 일관성이냐, 한 번 드는 비용이냐 계속 드는 비용이냐, 제약을 뚫을 것이냐 제약에 맞출 것이냐.

### A. 뒤로가기는 브라우저 방식으로 통일한다

앱 브릿지 인터페이스를 포기하고, 앱에서도 세션 히스토리만으로 뒤로가기를 다룬다. 앱과 웹을 나누면 기능이 늘어날 때마다 구현도 QA도 두 벌이다. 통일하는 비용은 지금 한 번이다. 그리고 앱의 뒤로가기가 이미 웹뷰 히스토리를 따르고 있었으니, 새 방식 도입이 아니라 실제 동작에 구현을 맞추는 일에 가깝다.

대가는 "확실한 뒤로가기 차단"을 포기하는 것이다. 진입 시 기준점 엔트리를 심되 첫 탭 전에는 스킵될 수 있다는 걸 받아들이고, 대신 **모든 화면에 홈 진입점을 둔다.** 이탈이 치명적인 이유가 재진입의 어려움이었으니, 그 난이도 자체를 낮춘다.

### B. 오버레이는 전부 뒤로가기로 닫힌다

팝업·바텀시트·모달의 열린 상태를 히스토리 엔트리 하나로 취급한다. 열기는 `pushState`, 뒤로가기는 `popstate`에서 닫기다. 하드웨어 백, 스와이프 백, UI 닫기 버튼이 모두 같은 결과를 내도록 맞춘다. 닫기 버튼은 반드시 `history.back()`을 호출해야 한다. 그렇지 않으면 stale 엔트리가 남아 다음 뒤로가기가 헛동작한다.

![바텀시트가 열린 상태를 히스토리 엔트리 하나로 취급하는 구조](/images/posts/navigation-policy/05-overlay-history.png)

유저가 뒤로가기에서 기대하는 건 "직전 상태로 복귀"다. 오버레이가 떠 있다면 직전 상태는 오버레이가 닫힌 화면이지 서비스 밖이 아니다. 이 결정은 A를 돕기도 한다. 오버레이를 여는 탭 한 번이 user activation이 되어, 진입 시 심은 기준점까지 함께 유효해진다.

### C. '나가기'는 시도하고, 안 되면 홈으로 폴백한다

'나가기'를 "이 서비스 컨텍스트에서 벗어난다" 하나로 정의한다. `window.close()`를 호출하고 `window.closed`가 `false`면 홈으로 이동한다. `if (isApp)` 같은 환경 분기는 없다. 어디서나 같은 코드가 실행되고 결과에 따라 폴백이 뜰 뿐이다.

![나가기 버튼의 동작: window.close()를 시도하고 닫히지 않으면 홈으로 폴백](/images/posts/navigation-policy/06-exit-fallback.png)

솔직히 적어두면, A를 택한 순간 웹에서는 이 폴백이 거의 항상 타는 경로가 된다. 진입 시 `pushState`로 기준점을 심으면 Chromium 기준 엔트리가 2개가 되어 그때부터 창을 닫을 수 없다. A가 C의 성공 조건을 없애는 구조다. 그래도 이 방식을 택한 이유는 나갈 수 없는 유저가 갇혀 있는 것보다 홈으로 가는 게 낫고, 닫을 수 있는 상황(우리가 `window.open`으로 띄운 결제창 등)에서는 여전히 정상 동작하기 때문이다.

## 마치며

세 문제는 따로 생긴 버그가 아니라 정책 부재가 낳은 하나의 부채였다. 정책을 정하려면 "브라우저가 왜 이걸 막는가"를 이해해야 했다. 막아둔 것들은 대부분 원래 안 하는 게 좋은 일이었고, 제약을 뚫는 대신 설계로 푸는 편이 결국 더 나은 경험이 됐다.

실기기에서 확인할 것이 남아 있다. 실제 알림톡 링크로 진입한 화면에서 iOS와 Android 각각 `history.length`와 `window.opener`가 어떻게 나오는지, 그리고 WKWebView가 진입 시 기준점 엔트리를 어떻게 다루는지다. 참고로 `pushState`로 오버레이를 관리하는 패턴은 브라우저도 임시 방편으로 보고 있어서, 뒤로가기와 ESC로 오버레이를 닫는 표준으로 `CloseWatcher` API가 나와 있다. iOS 지원이 확실해지면 그쪽으로 옮길 계획이다.

## 참고

- [History manipulation intervention in Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/history_manipulation_intervention.md)
- [window.close() Restrictions – Eric Lawrence](https://textslashplain.com/2021/02/04/window-close-restrictions/)
- [Browser Basics: User Gestures – Eric Lawrence](https://textslashplain.com/2020/05/18/browser-basics-user-gestures/)
- [Making user activation consistent across APIs – Chrome for Developers](https://developer.chrome.com/blog/user-activation)
- [history.length is not 1 when navigating to page from _blank link – Apple Developer Forums](https://developer.apple.com/forums/thread/720146)
- [WICG/close-watcher](https://github.com/WICG/close-watcher)
