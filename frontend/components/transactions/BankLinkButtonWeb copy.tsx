import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { usePlaidLink } from 'react-plaid-link';
import { getLinkTokenFromAsyncStorage, saveLinkTokenToAsyncStorage } from '@/utils/plaidUtils'; // Import modified functions
import { getLinkToken } from '@/services/plaid';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const BankLinkButton: React.FC = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchLinkToken = async () => {
      if (!linkToken) {
        setLoading(true);
        try {
          // Fetch link token from AsyncStorage or backend
          const tokenFromStorage = await getLinkTokenFromAsyncStorage();
          if (tokenFromStorage) {
            setLinkToken(tokenFromStorage); // Use token from AsyncStorage if available
          } else {
            const data = await getLinkToken();
            await saveLinkTokenToAsyncStorage(data.link_token);
            setLinkToken(data.link_token);
          }
        } catch (error) {
          console.error('Error fetching link token:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLinkToken();
  }, [linkToken]);

  const onSuccess = (public_token: string, metadata: any) => {
    console.log('Successfully linked the account:', metadata, 'public token:', public_token);
  };

  const { open, ready, error } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
    onExit: (error: any) => {
      if (error) {
        console.error('Plaid Link exited with error:', error);
      } else {
        console.log('Plaid Link exited without errors.');
      }
    },
  });

  console.log('ready:', ready, 'error:', error);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : linkToken ? (
        <View style={styles.card}>
          <Text style={styles.title}>Link Your Bank Account</Text>
          <Text style={styles.description}>Click below to link your bank account with Plaid.</Text>
          <Button
            title="Link Account"
            onPress={() => open()}
            disabled={!ready}
            color="#007bff"
          />
          {error && <Text style={styles.error}>Error: {error.message}</Text>}
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading Plaid link token...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    marginTop: 16,
    color: 'red',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default BankLinkButton;
