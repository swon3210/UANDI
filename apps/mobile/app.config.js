// app.json을 source-of-truth로 두고, 빌드 환경별 동적 설정만 여기서 override한다.
//
// 특히 EAS Build에서는 Firebase native config를 file environment variable로 주입받기 때문에
// process.env.GOOGLE_SERVICES_JSON / GOOGLE_SERVICES_PLIST가 staged 파일 경로를 가리킨다.
// 로컬 prebuild는 이 env가 비어 있으므로 app.json의 정적 경로(심볼릭 링크)로 fallback한다.
//   - Android: google-services.json (FCM)
//   - iOS: GoogleService-Info.plist (FCM via @react-native-firebase/messaging)

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...(config.android ?? {}),
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
  ios: {
    ...(config.ios ?? {}),
    googleServicesFile:
      process.env.GOOGLE_SERVICES_PLIST ?? config.ios?.googleServicesFile,
  },
});
