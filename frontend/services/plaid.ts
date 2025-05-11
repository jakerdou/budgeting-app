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

export const exchangePublicToken = async (publicToken: string, userId: string, accounts: any[], institution_name: string) => {
    console.log('Exchanging public token...');
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_PLAID_PREFIX}/exchange-public-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            public_token: publicToken,
            user_id: userId,
            accounts: accounts,
            institution_name: institution_name,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange public token');
    }

    const data = await response.json();
    return data;
};


