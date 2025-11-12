import { createElement, debounce } from '../components/Component.js';
import { fetchData } from '../api.js';

const LOCAL_STORAGE_KEY = 'local_todos';
let allTodos = [];
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
 * Получает данные о todos из API и LocalStorage.
 */
async function loadTodosData(userId) {
    // 1. Данные из API
    const apiTodos = await fetchData(`/todos?userId=${userId}`);
    
    // 2. Данные из LocalStorage
    const localTodos = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    
    // Фильтруем локальные todos только для текущего пользователя
    const userLocalTodos = localTodos.filter(t => t.userId === userId);
    
    allTodos = [...apiTodos, ...userLocalTodos];
    return allTodos;
}

/**
 * Сохраняет todo в LocalStorage.
 * @param {object} newTodo - Новый объект todo.
 */
function saveNewTodo(newTodo) {
    const localTodos = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    localTodos.push(newTodo);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localTodos));
}

/**
 * Обрабатывает поиск и фильтрует список.
 */
const handleSearch = debounce((query, listElement) => {
    const filteredTodos = allTodos.filter(todo => {
        if (!query) return true;
        const search = query.toLowerCase();
        // ❗#users#todos - title содержит введенные данные из input
        return todo.title.toLowerCase().includes(search);
    });
    
    listElement.innerHTML = '';
    listElement.appendChild(renderTodoList(filteredTodos));
}, 300);


/**
 * Рендерит список todos.
 * @param {object[]} todos - Список todos для рендеринга.
 * @returns {HTMLElement} Элемент списка <ul>.
 */
function renderTodoList(todos) {
    return createElement('ul', { className: 'card-list todo-list' }, todos.map(todo => {
        const isCompleted = todo.completed;
        const isLocal = todo.id < 0;

        return createElement('li', {
            className: isCompleted ? 'todo-completed' : 'todo-pending',
            style: `background-color: ${isCompleted ? '#e8f5e9' : '#ffebee'}; border-left: 5px solid ${isCompleted ? '#4caf50' : '#f44336'};`
        }, [
            createElement('span', { style: `text-decoration: ${isCompleted ? 'line-through' : 'none'};` }, [
                todo.title + (isLocal ? ' (ЛОКАЛЬНАЯ)' : '')
            ]),
            createElement('span', {}, [isCompleted ? '✅ Готово' : '⏳ В работе'])
        ]);
    }));
}

/**
 * Обрабатывает форму добавления новой Todo.
 */
function handleAddTodo(e, listContainer) {
    e.preventDefault();
    const titleInput = e.target.elements.title;

    if (!titleInput.value) return;

    // 1. Создаем новую todo с фиктивным ID (отрицательным)
    const newTodo = {
        userId: currentUserId,
        id: Date.now() * -1, // Уникальный отрицательный ID
        title: titleInput.value,
        completed: false
    };

    // 2. Добавляем в общий список и сохраняем в LocalStorage
    allTodos.push(newTodo);
    saveNewTodo(newTodo);

    // 3. Очищаем форму и обновляем UI
    titleInput.value = '';
    listContainer.innerHTML = '';
    listContainer.appendChild(renderTodoList(allTodos));
}


/**
 * Главная функция рендеринга экрана Todos.
 */
export async function renderTodosScreen() {
    currentUserId = getUserIdFromHash();
    if (!currentUserId) {
        return createElement('div', {}, ['Ошибка: Не указан ID пользователя.']);
    }

    await loadTodosData(currentUserId);
    
    const listContainer = createElement('div', {});
    
    // 1. Строка поиска
    const searchInput = createElement('input', {
        type: 'text',
        placeholder: 'Поиск по заголовку Todo...'
    });
    searchInput.addEventListener('input', () => handleSearch(searchInput.value, listContainer));
    
    // 2. Форма добавления Todo
    const todoForm = createElement('form', { 
        listeners: { submit: (e) => handleAddTodo(e, listContainer) }
    }, [
        createElement('input', { type: 'text', name: 'title', placeholder: 'Введите текст новой Todo', required: true }),
        createElement('button', { type: 'submit' }, ['➕ Добавить Todo'])
    ]);

    // Изначальный рендеринг списка
    listContainer.appendChild(renderTodoList(allTodos));

    return createElement('div', {}, [
        createElement('h2', {}, [`Список Todos для User ID: ${currentUserId}`]),
        createElement('div', { className: 'search-container' }, [searchInput]),
        createElement('div', { className: 'add-form-container' }, [todoForm]),
        listContainer
    ]);
}