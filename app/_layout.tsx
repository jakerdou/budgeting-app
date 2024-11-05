// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import LoginScreen from './login';

function RootLayout() {
  const { user, loading } = useAuth();

  console.log('user', user);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{title: "Budgeting App"}} />
      {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
    </Stack>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
