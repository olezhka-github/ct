get_isc = function() {
    alert('Система ІКС не працює');
}

document.addEventListener('DOMContentLoaded', function () {

    // Знаходимо елементи меню
    const menuLink = document.getElementById('menuLink');
    const forumLink = document.getElementById('forumLink');
    const friendListLink = document.getElementById('friendListLink');

    // Знаходимо контейнери
    const ui = document.getElementById('ui');
    const forumContainer = document.getElementById('forumContainer');
    const friendList = document.getElementById('friendList');
    const authContainer = document.getElementById('auth');
    const toolbar = document.getElementById('toolbar');
    const userDisplay = document.getElementById('userDisplay');
    const errorMessage = document.getElementById('errorMessage');
    const chatHistory = document.getElementById('chatHistory');
    const chatMessageInput = document.getElementById('chatMessage');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const friendListContent = document.getElementById('friendListContent');

    // WebSocket підключення
    const socket = new WebSocket('http://ctserver.onrender.com/');

    // Логінізація
    document.getElementById('loginButton').addEventListener('click', function () {
        const usernameField = document.getElementById('loginUsername');
        const passwordField = document.getElementById('loginPassword');

        if (usernameField && passwordField) {
            const username = usernameField.value.trim();
            const password = passwordField.value.trim();

            if (username && password) {
                socket.send(JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                }));
            } else {
                errorMessage.innerText = 'Введіть ім’я користувача та пароль.';
            }
        } else {
            errorMessage.innerText = 'Поля для введення не знайдені.';
        }
    });

    // Створення акаунта
    document.getElementById('createAccountButton').addEventListener('click', function () {
        const usernameField = document.getElementById('loginUsername');
        const passwordField = document.getElementById('loginPassword');

        if (usernameField && passwordField) {
            const username = usernameField.value.trim();
            const password = passwordField.value.trim();

            if (username && password) {
                socket.send(JSON.stringify({
                    action: 'createAccount',
                    username: username,
                    password: password
                }));
            } else {
                errorMessage.innerText = 'Заповніть всі поля.';
            }
        } else {
            errorMessage.innerText = 'Поля для введення не знайдені.';
        }
    });

    // Додавання друга
    document.getElementById('addFriendButton').addEventListener('click', function () {
        const newFriendUsernameField = document.getElementById('newFriendUsername');
        const currentUsername = userDisplay.innerText.replace('Ви увійшли як ', '');

        if (newFriendUsernameField && currentUsername) {
            const newFriendUsername = newFriendUsernameField.value.trim();
            if (newFriendUsername) {
                socket.send(JSON.stringify({
                    action: 'addFriend',
                    username: currentUsername,
                    friendUsername: newFriendUsername
                }));
            } else {
                alert('Введіть ім’я друга для додавання.');
            }
        } else {
            alert('Поля для введення не знайдені або користувач не визначений.');
        }
    });

    // Обробка повідомлень від сервера
    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log(data);

        // Обробка логінізації
        if (data.action === 'login') {
            if (data.success) {
                authContainer.style.display = 'none';
                toolbar.style.display = 'block';
                ui.style.display = 'block';
                userDisplay.innerText = `Ви увійшли як ${data.username}`;
            } else {
                errorMessage.innerText = data.message || 'Неправильне ім’я користувача або пароль';
            }
        }

        // Обробка створення акаунта
        if (data.action === 'createAccount') {
            if (data.success) {
                errorMessage.innerText = 'Акаунт успішно створено. Увійдіть, будь ласка.';
            } else {
                errorMessage.innerText = data.message || 'Не вдалося створити акаунт.';
            }
        }

        // Обробка додавання друга
        if (data.action === 'addFriend') {
            if (data.success) {
                const li = document.createElement('li');
                li.innerText = data.friendUsername;
                friendListContent.appendChild(li);
            } else {
                alert(data.message || 'Не вдалося додати друга.');
            }
        }

        // Обробка отриманого списку друзів
        if (data.action === 'load_friend_list') {
            friendListContent.innerHTML = '';
            if (data.friends && data.friends.length > 0) {
                data.friends.forEach(friend => {
                    const li = document.createElement('li');
                    li.innerText = friend;
                    friendListContent.appendChild(li);
                });
            } else {
                friendListContent.innerHTML = '<li>Немає друзів.</li>';
            }
        }

        // Обробка повідомлень у чаті
        if (data.action === 'new_message') {
            const message = document.createElement('div');
            message.innerText = `${data.username}: ${data.message}`;
            chatHistory.appendChild(message);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    };

    // Відправка повідомлень у чаті
    sendMessageButton.addEventListener('click', function () {
        const messageField = chatMessageInput.value.trim();
        const currentUsername = userDisplay.innerText.replace('Ви увійшли як ', '');

        if (messageField && currentUsername) {
            socket.send(JSON.stringify({
                action: 'sendMessage',
                username: currentUsername,
                message: messageField
            }));
            chatMessageInput.value = '';
        } else {
            alert('Повідомлення не може бути пустим або користувач не визначений.');
        }
    });

    // Відображення налаштувань
    document.getElementById('settingsLink').addEventListener('click', function () {
        document.getElementById('settings').style.display = 'block';
        ui.style.display = 'none';
        forumContainer.style.display = 'none';
        friendList.style.display = 'none';
    });

    // Переключення між вкладками

    // Головне меню
    menuLink.addEventListener('click', function () {
        ui.style.display = 'block';
        forumContainer.style.display = 'none';
        friendList.style.display = 'none';
        document.getElementById('settings').style.display = 'none';
    });

    // CT Форум
    forumLink.addEventListener('click', function () {
        forumContainer.style.display = 'block';
        ui.style.display = 'none';
        friendList.style.display = 'none';
        document.getElementById('settings').style.display = 'none';
    });

    // Вкладка Друзі
    friendListLink.addEventListener('click', function () {
        friendList.style.display = 'block';
        ui.style.display = 'none';
        forumContainer.style.display = 'none';
        document.getElementById('settings').style.display = 'none';

        // Завантажити список друзів
        const currentUsername = userDisplay.innerText.replace('Ви увійшли як ', '');
        if (currentUsername) {
            socket.send(JSON.stringify({
                action: 'loadFriendList',
                username: currentUsername
            }));
        } else {
            alert('Користувач не визначений.');
        }
    });

    // Закриття WebSocket-з'єднання
    socket.onclose = function (event) {
        console.log('WebSocket закрито', event);
    };

    // Обробка помилок WebSocket-з'єднання
    socket.onerror = function (error) {
        alert('Виникла помилка при підключенні до API. Ми не переадресовуємо вас на Google');
       
    };
});

