import { createElement, debounce } from '../components/Component.js';
import { fetchData } from '../api.js';

let allPosts = [];
let currentUserId = null;

/**
 * Извлекает ID пользователя из URL-хэша.
 * @returns {number|null} ID пользователя.
 */
function getUserIdFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/userId=(\d+|-\d+)/); 
    return match ? parseInt(match[1]) : null;
}

/**
 * Получает данные о постах из API.
 */
async function loadPostsData(userId) {
    allPosts = await fetchData(`/posts?userId=${userId}`);
    return allPosts;
}

/**
 * Обрабатывает поиск и фильтрует список.
 */
const handleSearch = debounce((query, listElement) => {
    const filteredPosts = allPosts.filter(post => {
        if (!query) return true;
        const search = query.toLowerCase();
        // ❗#users#posts - title или body содержит данные из input
        return post.title.toLowerCase().includes(search) || post.body.toLowerCase().includes(search);
    });
    
    listElement.innerHTML = '';
    listElement.appendChild(renderPostList(filteredPosts));
}, 300);


/**
 * Рендерит список постов.
 * @param {object[]} posts - Список постов для рендеринга.
 * @returns {HTMLElement} Элемент списка <ul>.
 */
function renderPostList(posts) {
    return createElement('ul', { className: 'card-list post-list' }, posts.map(post => {
        const linkToComments = createElement('a', {
            href: `#users#posts#comments?postId=${post.id}`
        }, ['[Комментарии]']);
        
        return createElement('li', {}, [
            createElement('div', {}, [
                createElement('strong', {}, [post.title]),
                createElement('p', { className: 'post-body' }, [post.body.substring(0, 100) + '...'])
            ]),
            linkToComments
        ]);
    }));
}

/**
 * Главная функция рендеринга экрана Posts.
 */
export async function renderPostsScreen() {
    currentUserId = getUserIdFromHash();
    if (!currentUserId) {
        return createElement('div', {}, ['Ошибка: Не указан ID пользователя.']);
    }

    await loadPostsData(currentUserId);
    
    const listContainer = createElement('div', {});
    
    // 1. Строка поиска
    const searchInput = createElement('input', {
        type: 'text',
        placeholder: 'Поиск по заголовку или тексту поста...'
    });
    searchInput.addEventListener('input', () => handleSearch(searchInput.value, listContainer));
    
    // Изначальный рендеринг списка
    listContainer.appendChild(renderPostList(allPosts));

    return createElement('div', {}, [
        createElement('h2', {}, [`Список Постов для User ID: ${currentUserId}`]),
        createElement('div', { className: 'search-container' }, [searchInput]),
        listContainer
    ]);
}