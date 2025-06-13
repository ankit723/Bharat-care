import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../lib/authContext";
import { notificationService } from "../lib/notificationService";
import "./globals.css";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Initialize notification service
    const initializeServices = async () => {
      try {
        await notificationService.initializeService();
        console.log('Notification service initialized');
      } catch (error) {
        console.error('Error initializing notification service:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    initializeServices();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="alarm" 
          options={{
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
