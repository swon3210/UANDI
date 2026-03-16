import { StyleSheet } from 'react-native';

import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';


export default function GalleryScreen() {
  return (
    <WebView
    style={styles.container}
    source={{ uri: 'https://my-timer-chi.vercel.app/gallery-timer' }}
  />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
