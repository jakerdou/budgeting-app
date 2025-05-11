export const getCategoriesWithAllocated = async (userId: string, startDate: Date, endDate: Date) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/get-categories-with-allocated`, {
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
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/get-allocated`, {
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

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/create-category`, {
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

export const deleteCategory = async (userId: string, categoryId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/delete-category`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            category_id: categoryId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete category');
    }

    const data = await response.json();
    return data;
};