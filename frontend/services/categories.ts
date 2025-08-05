// filepath: c:\Users\james\dev\budgeting-app-3\frontend\services\categories.ts

export const getAllocatedAndSpent = async (userId: string, startDate: string, endDate: string) => {
    // Dates are already in YYYY-MM-DD format, no need to format them
    const formattedStartDate = startDate;
    const formattedEndDate = endDate;
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/get-allocated-and-spent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch allocated and spent amounts');
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

export const updateCategoryName = async (userId: string, categoryId: string, newName: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/update-category-name`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            category_id: categoryId,
            name: newName,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update category name');
    }

    const data = await response.json();
    return data;
};

export const updateCategoryGoal = async (userId: string, categoryId: string, goalAmount: number) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/update-category-goal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            category_id: categoryId,
            goal_amount: goalAmount,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update category goal');
    }

    const data = await response.json();
    return data;
};