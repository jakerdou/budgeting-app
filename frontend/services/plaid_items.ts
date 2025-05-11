export const getPlaidItems = async (userId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_PLAID_ITEM_PREFIX}/get-plaid-items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch plaid items');
    }

    const data = await response.json();
    return data.plaid_items;
};

export const deletePlaidItem = async (itemId: string) => {
    console.log(`DELETE API call for item ID: ${itemId}`);
    console.log(`Endpoint: ${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_PLAID_ITEM_PREFIX}/delete-plaid-item`);
    
    try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_PLAID_ITEM_PREFIX}/delete-plaid-item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId,
            }),
        });

        console.log('DELETE response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`Failed to delete plaid item: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('DELETE response data:', data);
        return data;
    } catch (error) {
        console.error('Exception in deletePlaidItem:', error);
        throw error;
    }
};