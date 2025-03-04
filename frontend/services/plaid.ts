export const getLinkToken = async () => {
    console.log('Fetching link token...');
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_PLAID_PREFIX}/get-link-token`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch link token');
    }

    const data = await response.json();
    return data;
};
