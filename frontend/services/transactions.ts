export const getTransactions = async (userId: string) => {

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_TRANSACTION_PREFIX}/get-transactions`, {
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
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_TRANSACTION_PREFIX}/create-transaction`, {
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

export const deleteTransaction = async (userId: string, transactionId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_TRANSACTION_PREFIX}/delete-transaction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            transaction_id: transactionId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to delete transaction');
    }

    const data = await response.json();
    return data;
};

export const updateTransactionCategory = async (userId: string, transactionId: string, categoryId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_TRANSACTION_PREFIX}/update-transaction-category`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            transaction_id: transactionId,
            category_id: categoryId
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update transaction category');
    }

    const data = await response.json();
    return data;
};

export const syncPlaidTransactions = async (userId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_TRANSACTION_PREFIX}/sync-plaid-transactions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
        throw new Error('Failed to sync transactions');
    }

    const data = await response.json();
    return data;
};

