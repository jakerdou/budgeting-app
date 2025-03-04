import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

export const saveLinkTokenToAsyncStorage = async (token: string) => {
    console.log('Saving link token to AsyncStorage:', token);
    const expirationTime = Date.now() + 30 * 60 * 1000; // Token expiration in 30 minutes
    await AsyncStorage.setItem('link_token', JSON.stringify({ token, expirationTime }));
};

export const getLinkTokenFromAsyncStorage = async (): Promise<string | null> => {
    try {
        const storedToken = await AsyncStorage.getItem('link_token');
        console.log('Stored token:', storedToken);
        if (storedToken) {
            const { token, expirationTime } = JSON.parse(storedToken);
            if (Date.now() > expirationTime) {
                await AsyncStorage.removeItem('link_token'); // Remove expired token
                return null;
            }
            return token;
        }
    } catch (error) {
        console.error('Error getting link token from AsyncStorage:', error);
    }
    return null;
};
