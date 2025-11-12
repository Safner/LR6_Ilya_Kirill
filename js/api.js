const BASE_URL = 'https://jsonplaceholder.typicode.com';

/**
 * Универсальная функция для получения данных
 * @param {string} endpoint - Например, '/users' или '/todos?userId=1'.
 */
export async function fetchData(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) {
            console.error('Ошибка API, возможно превышен лимит 5 req/sec');
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        return [];
    }
}