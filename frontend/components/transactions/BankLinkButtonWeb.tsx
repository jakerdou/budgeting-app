import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { usePlaidLink } from 'react-plaid-link';
import { getLinkTokenFromAsyncStorage, saveLinkTokenToAsyncStorage } from '@/utils/plaidUtils'; // Import modified functions
import { getLinkToken, exchangePublicToken } from '@/services/plaid';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useAuth } from '@/context/AuthProvider';

const BankLinkButton: React.FC = () => {
  const { user } = useAuth();
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

  const onSuccess = async (public_token: string, metadata: any) => {
    console.log('Successfully linked the account:', metadata, 'public token:', public_token);
    // call endpoint to get access token from public token, 
    // then call endpoint (separate endpoint, pass in access token and account metadata) to save linked accounts to database
    const filteredAccounts = metadata.accounts.map((account: any) => ({
      account_id: account.id,
      name: account.name,
      type: account.type,
    }));
    await exchangePublicToken(public_token, user?.uid || '', filteredAccounts, metadata.institution.name);
  };

  // console.log('token:', linkToken);
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

  // console.log('ready:', ready, 'error:', error);
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : linkToken ? (
        <TouchableOpacity
          style={[styles.button, !ready && styles.buttonDisabled]}
          onPress={() => open()}
          disabled={!ready}
        >
          <Text style={styles.buttonText}>Link Account</Text>
        </TouchableOpacity>
      ) : (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 300,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    width: 'auto',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
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
