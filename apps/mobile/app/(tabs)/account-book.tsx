import { StyleSheet } from 'react-native';

import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';


export default function AccountBookScreen() {
  return (
    <WebView
    style={styles.container}
    source={{ uri: 'https://my-timer-chi.vercel.app/account-book/home' }}
  />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
