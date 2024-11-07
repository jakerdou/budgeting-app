export const getTransactions = async (userId: string) => {

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/get-transactions`, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      user_id: userId,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
  
    const data = await response.json();
    return data;
};

export const addTransaction = async (userId: string, amount: number, categoryId: string, name: string, date: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-transaction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            amount: amount,
            category_id: categoryId,
            name: name,
            date: date,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create transaction');
    }

    const data = await response.json();
    return data;
};

