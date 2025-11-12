import { createElement, debounce } from '../components/Component.js';
import { fetchData } from '../api.js';

let allComments = [];
let currentPostId = null;

/**
 * Извлекает ID поста из URL-хэша.
 * @returns {number|null} ID поста.
 */
function getPostIdFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/postId=(\d+|-\d+)/); 
    return match ? parseInt(match[1]) : null;
}

/**
 * Получает данные о комментариях из API.
 */
async function loadCommentsData(postId) {
    allComments = await fetchData(`/comments?postId=${postId}`);
    return allComments;
}

/**
 * Обрабатывает поиск и фильтрует список.
 */
const handleSearch = debounce((query, listElement) => {
    const filteredComments = allComments.filter(comment => {
        if (!query) return true;
        const search = query.toLowerCase();
        // ❗#users#posts#comments - name или body содержат данные из input
        return comment.name.toLowerCase().includes(search) || comment.body.toLowerCase().includes(search);
    });
    
    listElement.innerHTML = '';
    listElement.appendChild(renderCommentList(filteredComments));
}, 300);


/**
 * Рендерит список комментариев.
 * @param {object[]} comments - Список комментариев для рендеринга.
 * @returns {HTMLElement} Элемент списка <ul>.
 */
function renderCommentList(comments) {
    return createElement('ul', { className: 'card-list comment-list' }, comments.map(comment => {
        return createElement('li', { style: 'display: block;' }, [
            createElement('div', {}, [
                createElement('strong', {}, [comment.name]),
                createElement('span', { style: 'color: #777; margin-left: 10px;' }, [`(${comment.email})`]),
            ]),
            createElement('p', { className: 'comment-body' }, [comment.body])
        ]);
    }));
}

/**
 * Главная функция рендеринга экрана Comments.
 */
export async function renderCommentsScreen() {
    currentPostId = getPostIdFromHash();
    if (!currentPostId) {
        return createElement('div', {}, ['Ошибка: Не указан ID поста.']);
    }

    await loadCommentsData(currentPostId);
    
    const listContainer = createElement('div', {});
    
    // 1. Строка поиска
    const searchInput = createElement('input', {
        type: 'text',
        placeholder: 'Поиск по заголовку или тексту комментария...'
    });
    searchInput.addEventListener('input', () => handleSearch(searchInput.value, listContainer));
    
    // Изначальный рендеринг списка
    listContainer.appendChild(renderCommentList(allComments));

    return createElement('div', {}, [
        createElement('h2', {}, [`Список Комментариев для Post ID: ${currentPostId}`]),
        createElement('div', { className: 'search-container' }, [searchInput]),
        listContainer
    ]);
}