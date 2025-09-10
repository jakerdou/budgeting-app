// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { CategoriesProvider } from '@/context/CategoriesProvider';
import LoginScreen from './login';
import BasicLandingPage from '@/components/BasicLandingPage';
import NoBackendConnection from '@/components/NoBackendConnection';
import { pingBackend } from '@/services/health';

function RootLayout() {
  const { user, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);
  const [checkingBackend, setCheckingBackend] = useState(false);

  // console.log('user', user);

  const checkBackendConnection = () => {
    setCheckingBackend(true);
    pingBackend()
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false))
      .finally(() => setCheckingBackend(false));
  };

  useEffect(() => {
    if (user) {
      checkBackendConnection();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    if (showLanding) {
      return (
        <BasicLandingPage 
          onGetStarted={() => setShowLanding(false)} 
        />
      );
    }
    return <LoginScreen />;
  }

  if (checkingBackend) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Connecting to server...</Text>
      </View>
    );
  }

  if (!backendConnected) {
    return <NoBackendConnection onRetry={checkBackendConnection} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ title: "Budgeting App", headerShown: false }} />
    </Stack>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <RootLayout />
      </CategoriesProvider>
    </AuthProvider>
  );
}
