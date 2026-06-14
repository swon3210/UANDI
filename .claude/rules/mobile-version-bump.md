# 모바일 production 빌드 전 버전 이름 bump 필수

`apps/mobile`을 production으로 빌드/제출하기 전에 **반드시** `apps/mobile/app.json`의
`expo.version`(= Android versionName / iOS marketing version)을 직전 출시본보다 높게 올린다.

## 왜 필요한가

- `eas.json`은 `appVersionSource: "remote"` + `production.autoIncrement: true`라서
  **버전 코드(versionCode)는 EAS가 서버에서 자동으로 올린다.**
- 하지만 **버전 이름(`app.json`의 `version`)은 자동으로 올라가지 않는다.** 손으로 올려야 한다.
- 이 비대칭 때문에 "코드는 최신인데 이름은 옛날 버전"인 빌드가 출시될 수 있다.
  (실제 사고: versionCode는 16→17로 올라갔지만 versionName이 1.0.1 그대로라
   플레이 콘솔에 1.1.0 대신 1.0.1이 최신으로 표시됨)

## 절차 (production 빌드/제출 요청을 받으면 코드 빌드 명령 실행 전에)

1. 현재 값 확인:
   ```bash
   node -p "require('./apps/mobile/app.json').expo.version"
   ```
2. 직전 bump 커밋 확인 (마지막으로 올린 값이 무엇인지):
   ```bash
   git log --oneline -5 -- apps/mobile/app.json
   ```
3. `app.json`의 `expo.version`이 **직전 출시본과 같거나 낮으면** 빌드하지 말고 먼저 올린다.
   - 버그픽스/작은 변경: patch (1.1.1 → 1.1.2)
   - 기능 추가: minor (1.1.x → 1.2.0)
4. 버전 변경은 별도 커밋으로 남긴다:
   ```
   chore: 모바일 앱 버전 1.1.1 → 1.1.2
   ```
5. 빌드는 `--auto-submit`으로 빌드+제출을 한 번에:
   ```bash
   cd apps/mobile && eas build --platform android --profile production --auto-submit
   ```

## 절대 하지 말 것

- `app.json`의 `version`을 확인/bump하지 않고 production 빌드 시작
- 버전 코드(versionCode)를 `app.json`에 직접 적기 (remote source가 관리하므로 손대지 않는다)
