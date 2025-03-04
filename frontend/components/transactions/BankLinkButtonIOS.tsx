import React, { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, StyleSheet, Button } from 'react-native';

// if (Platform.OS === 'ios') {
  import { create, open, dismissLink, LinkSuccess, LinkExit, LinkIOSPresentationStyle, LinkLogLevel } from 'react-native-plaid-link-sdk';
// }

// var styles = require('./style');

import { getLinkTokenFromAsyncStorage, saveLinkTokenToAsyncStorage } from '@/utils/plaidUtils'; // Import modified functions
import { getLinkToken } from '@/services/plaid';

const HomeScreen = ({ navigation }: any) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const address = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';

  const fetchLinkToken = async () => {
    // setLoading(true);
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
      // setLoading(false);
    }
  };

  useEffect(() => {
    if (!linkToken) {
      fetchLinkToken(); // Fetch the link token when the component mounts
    } else {
      // Once linkToken is available, configure and create the Plaid Link
      try {
        const tokenConfiguration = createLinkTokenConfiguration(linkToken);
        create(tokenConfiguration);
      } catch (error) {
        console.error('Error initializing Plaid SDK:', error);
      }
    }
  }, [linkToken]);

  const createLinkTokenConfiguration = (token: string, noLoadingState: boolean = false) => {
    return {
      token: token,
      noLoadingState: noLoadingState,
    };
  };

  const createLinkOpenProps = () => {
    return {
      onSuccess: async (success: LinkSuccess) => {
        // await fetch(`http://${address}:8080/api/exchange_public_token`, {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({ public_token: success.publicToken }),
        // })
        //   .catch((err) => {
        //     console.log(err);
        //   });
        // navigation.navigate('Success', success);
        console.log('Success: ', success);
      },
      onExit: (linkExit: LinkExit) => {
        console.log('Exit: ', linkExit);
        dismissLink();
      },
      iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
      logLevel: LinkLogLevel.ERROR,
    };
  };

  const handleOpenLink = () => {
    console.log('Opening link...');
    const openProps = createLinkOpenProps();
    open(openProps);
  };

  return (
    <Button
      title="Open Link"
      onPress={handleOpenLink}
    />
  );
};

export default HomeScreen;
