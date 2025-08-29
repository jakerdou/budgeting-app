
export const getCategoryGroups = async (userId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/get-category-groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch category groups');
    }

    const data = await response.json();
    return data;
};

export const getCategoryGroup = async (userId: string, categoryGroupId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/get-category-group`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            category_group_id: categoryGroupId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch category group');
    }

    const data = await response.json();
    return data;
};

export const createCategoryGroup = async (userId: string, name: string, sortOrder: number = 0) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/create-category-group`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            name: name,
            sort_order: sortOrder,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create category group');
    }

    const data = await response.json();
    return data;
};

export const deleteCategoryGroup = async (userId: string, categoryGroupId: string) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_CATEGORY_PREFIX}/delete-category-group`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            category_group_id: categoryGroupId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete category group');
    }

    const data = await response.json();
    return data;
};
