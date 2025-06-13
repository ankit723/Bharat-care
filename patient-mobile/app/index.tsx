import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../lib/authContext";
import { APP_CONFIG } from "../lib/config";

export default function Index() {
  const { authState, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading || authState.isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator 
          size="large" 
          color={APP_CONFIG.THEME_COLOR} 
        />
      </View>
    );
  }

  // Redirect based on authentication status
  if (authState.isAuthenticated && authState.user) {
    return <Redirect href="/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
