import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, Platform } from 'react-native';

// Conditionally import Plaid SDK only on native platforms (iOS/Android)
let PlaidSDK: any;
if (Platform.OS !== 'web') {
  PlaidSDK = require('react-native-plaid-link-sdk');
}

import { getLinkTokenFromAsyncStorage, saveLinkTokenToAsyncStorage } from '@/utils/plaidUtils'; // Import modified functions
import { getLinkToken } from '@/services/plaid';

const BankLinkButtonIOS: React.FC = () => {
  if (Platform.OS === 'web') {
    return (
      <Text>Web version of bank linking is not available. Use Plaid link on iOS</Text>
    );
  }

  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchLinkToken = async () => {
    setLoading(true);
    try {
      // Fetch link token from AsyncStorage or backend
      const tokenFromStorage = await getLinkTokenFromAsyncStorage();
      console.log('Token from storage:', tokenFromStorage); // Add logging for better debugging
      if (tokenFromStorage) {
        setLinkToken(tokenFromStorage); // Use token from AsyncStorage if available
      } else {
        const data = await getLinkToken();
        console.log('Fetched link token:', data); // Add logging here
        await saveLinkTokenToAsyncStorage(data.link_token);
        setLinkToken(data.link_token);
      }
    } catch (error) {
      console.error('Error fetching link token:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!linkToken) {
      fetchLinkToken(); // Fetch the link token when the component mounts
    } else {
      // Once linkToken is available, configure and create the Plaid Link
      try {
        PlaidSDK.create({
          token: linkToken,
          noLoadingState: false,
        });
      } catch (error) {
        console.error('Error initializing Plaid SDK:', error);
      }
    }
  }, [linkToken]);

  // Success callback
  const onSuccess = (success: any) => {
    console.log('Successfully linked the account:', success);
    // Handle Plaid success here (e.g., send public token to backend)
    fetch('http://your-backend-url/api/exchange_public_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token: success.publicToken }),
    }).catch((error) => {
      console.error('Error exchanging public token:', error);
    });
  };

  // Exit callback
  const onExit = (exit: any) => {
    console.log('Exit:', exit);
    if (PlaidSDK) PlaidSDK.dismissLink(); // Close the Plaid Link modal
  };

  // Create the link open props
  const createLinkOpenProps = () => {
    return {
      onSuccess,
      onExit,
      iOSPresentationStyle: PlaidSDK.LinkIOSPresentationStyle.FULL_SCREEN,
      logLevel: PlaidSDK.LinkLogLevel.ERROR,
    };
  };

  // Handle opening the Plaid link modal
  const handleOpenLink = () => {
    console.log('Opening Plaid Link...');
    if (linkToken && PlaidSDK) {
      console.log('Link token:', linkToken);
      try {
        PlaidSDK.open(createLinkOpenProps());
      } catch (error) {
        console.error('Error opening Plaid Link modal:', error);
      }
    } else {
      console.error('Link token is missing or Plaid SDK is not available');
    }
  };

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
            onPress={handleOpenLink}
            color="#007bff"
          />
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
  loadingText: {
    fontSize: 16,
    color: 'gray',
  },
});

export default BankLinkButtonIOS;
