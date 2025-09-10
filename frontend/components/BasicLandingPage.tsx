import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface BasicLandingPageProps {
  onGetStarted: () => void;
}

export default function BasicLandingPage({ onGetStarted }: BasicLandingPageProps) {
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>EasyBudget</Text>
        
        <Text style={styles.subtitle}>
          Manage your finances, the easy way.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={onGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        
        <Text style={styles.footer}>
          © {currentYear} EasyBudget
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    maxWidth: 600,
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 32,
    lineHeight: 28,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 48,
    shadowColor: '#007BFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
