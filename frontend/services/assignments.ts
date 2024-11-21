export const createAssignment = async (assignment: { amount: number; user_id: string; category_id: string; date: string }) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${process.env.EXPO_PUBLIC_ASSIGNMENT_PREFIX}/create-assignment`, {
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