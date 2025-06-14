import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, Text, View, ActivityIndicator, StyleSheet, BackHandler } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WebView } from 'react-native-webview';

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setIsConnected(state.isConnected);
    });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => {
      unsubscribe();
      backHandler.remove();
    };
  }, [canGoBack]);

  if (isConnected === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {isConnected ? (
        <WebView
          ref={webviewRef}
          source={{ uri: 'https://bharatcare.techmorphers.com' }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>Please connect to the internet to use TechMorphers.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
});
