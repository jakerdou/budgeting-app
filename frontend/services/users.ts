export const getPreferences = async (userId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_USER_PREFIX}/get-preferences`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create transaction');
    }

    const data = await response.json();
    return data;
}

export const updatePreferences = async (userId: string, preferences: any) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_USER_PREFIX}/update-preferences`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            preferences
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create transaction');
    }

    const data = await response.json();
    return data;
}