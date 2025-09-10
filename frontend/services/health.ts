export const checkHealth = async () => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health/`);
    
    if (!response.ok) {
        throw new Error('Health check failed');
    }
    
    return await response.json();
};

export const pingBackend = async () => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health/ping`);
    return await response.json();
};
