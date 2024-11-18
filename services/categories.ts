export const getCategoriesWithAllocated = async (userId: string, startDate: Date, endDate: Date) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/get-categories-with-allocated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
  
    const data = await response.json();
    return data;
};

export const getAllocated = async (userId: string, startDate: Date, endDate: Date) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/get-allocated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
  
    const data = await response.json();
    return data;
};

export const addCategory = async (userId: string, newCategoryName: string) => {

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-category`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        user_id: userId,
        name: newCategoryName,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to add category');
    }

    const data = await response.json();
    return data;

};

export const createAssignment = async (assignment: { amount: number; user_id: string; category_id: string; date: string }) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-assignment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
    });

    if (!response.ok) {
        throw new Error('Failed to create assignment');
    }

    const data = await response.json();
    return data;
};