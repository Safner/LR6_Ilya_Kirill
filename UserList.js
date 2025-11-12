
import { createElement, debounce } from '../components/Component.js';
import { fetchData } from '../api.js';

const LOCAL_STORAGE_KEY = 'local_users';
let allUsers = [];

/**
 * Получает данные о пользователях из API и LocalStorage.
 */
async function loadUsersData() {
    const apiUsers = await fetchData('/users');
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    allUsers = [...apiUsers, ...localUsers];
    return allUsers;
}

/**
 * Сохраняет локальных пользователей в LocalStorage.
 * @param {object[]} users - Список всех пользователей.
 */
function saveLocalUsers(users) {
    // Фильтруем только пользователей с фиктивным ID (локальные)
    const localUsers = users.filter(u => u.id < 0);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localUsers));
}

/**
 * Обрабатывает поиск и фильтрует список.
 */
const handleSearch = debounce((query, listElement) => {
    const filteredUsers = allUsers.filter(user => {
        if (!query) return true;
        const search = query.toLowerCase();
        // ❗#users - имя или email пользователя содержит введенные данные
        return user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    });
    // Перерисовываем только список
    listElement.innerHTML = '';
    listElement.appendChild(renderUserList(filteredUsers));
});


/**
 * Рендерит список пользователей.
 * @param {object[]} users - Список пользователей для рендеринга.
 * @returns {HTMLElement} Элемент списка <ul>.
 */
function renderUserList(users) {
    const userList = createElement('ul', { className: 'card-list' }, users.map(user => {
        const isLocal = user.id < 0;
        
        const deleteButton = isLocal ? createElement('button', {
            listeners: { click: () => handleDeleteUser(user.id) }
        }, ['Удалить']) : null;

        const linkToTodos = createElement('a', {
            href: `#users#todos?userId=${user.id}`
        }, ['[Todos]']);

        const linkToPosts = createElement('a', {
            href: `#users#posts?userId=${user.id}`
        }, ['[Posts]']);
        
        return createElement('li', {
            'data-id': user.id,
            className: isLocal ? 'local-user' : ''
        }, [
            createElement('div', {}, [
                createElement('strong', {}, [user.name]),
                createElement('span', {}, [` (${user.email}) `])
            ]),
            createElement('div', {}, [
                linkToTodos,
                linkToPosts,
                deleteButton
            ])
        ]);
    }));

    return userList;
}

/**
 * Удаляет локального пользователя из списка и LocalStorage.
 * @param {number} userId - ID пользователя для удаления.
 */
function handleDeleteUser(userId) {
    // ❗ Тут же нужно удалить все связанные todos из localStorage, если они есть.
    
    allUsers = allUsers.filter(u => u.id !== userId);
    saveLocalUsers(allUsers);
    
    // Обновляем UI без перезагрузки
    const listContainer = document.querySelector('#app-root > div:last-child'); // Находим контейнер списка
    if (listContainer) {
        listContainer.innerHTML = '';
        listContainer.appendChild(renderUserList(allUsers));
    } else {
        window.location.reload(); 
    }
}

/**
 * Обрабатывает форму добавления нового пользователя.
 * @param {Event} e - Событие формы.
 * @param {HTMLElement} listContainer - Контейнер для списка, который нужно обновить.
 */
function handleAddUser(e, listContainer) {
    e.preventDefault();
    const nameInput = e.target.elements.name;
    const emailInput = e.target.elements.email;

    if (!nameInput.value || !emailInput.value) return;

    // 1. Создаем нового пользователя с фиктивным ID (отрицательным)
    const newUser = {
        id: Date.now() * -1, // Уникальный отрицательный ID
        name: nameInput.value,
        email: emailInput.value
    };

    // 2. Добавляем в общий список и сохраняем локальных
    allUsers.push(newUser);
    saveLocalUsers(allUsers);

    // 3. Очищаем форму и обновляем UI
    nameInput.value = '';
    emailInput.value = '';
    listContainer.innerHTML = '';
    listContainer.appendChild(renderUserList(allUsers));
}

/**
 * Главная функция рендеринга экрана.
 */
export async function renderUserListScreen() {
    await loadUsersData();

    // 1. Строка поиска
    const searchInput = createElement('input', {
        type: 'text',
        placeholder: 'Поиск по имени или email...'
    });
    const listContainer = createElement('div', {}); // Контейнер для списка, который будем обновлять

    // 2. Слушатель для поиска (debounce привязан к input)
    searchInput.addEventListener('input', () => handleSearch(searchInput.value, listContainer));
    
    // 3. Форма добавления пользователя
    const userForm = createElement('form', { 
        listeners: { submit: (e) => handleAddUser(e, listContainer) }
    }, [
        createElement('input', { type: 'text', name: 'name', placeholder: 'Имя пользователя', required: true }),
        createElement('input', { type: 'email', name: 'email', placeholder: 'Email пользователя', required: true }),
        createElement('button', { type: 'submit' }, ['➕ Добавить Пользователя'])
    ]);

    // Изначальный рендеринг списка
    listContainer.appendChild(renderUserList(allUsers));

    return createElement('div', {}, [
        createElement('h2', {}, ['Список Пользователей']),
        createElement('div', { className: 'search-container' }, [searchInput]),
        createElement('div', { className: 'add-form-container' }, [userForm]),
        listContainer
    ]);
}