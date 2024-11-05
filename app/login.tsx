// app/login.tsx
import React, { useState } from 'react';
import { View, Button, Text, TextInput, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthProvider';

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = async () => {
    if (isSignup) {
      await signup(email, password);
    } else {
      await login(email, password);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignup ? "Sign Up" : "Log In"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isSignup ? "Sign Up" : "Log In"} onPress={handleAuth} />
      <Button
        title={isSignup ? "Already have an account? Log In" : "Create an account"}
        onPress={() => setIsSignup(!isSignup)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10 },
});
