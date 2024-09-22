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
    const socket = new WebSocket('ws://127.0.0.1:2573');

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
        alert('Виникла помилка при підключенні до API. Ми переадресуємо вас на сторінку Google.');
        window.location.href = "https://www.google.com";
    };
});
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
    const socket = new WebSocket('ws://127.0.0.1:2573');

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
        alert('Виникла помилка при підключенні до API. Ми переадресуємо вас на сторінку Google.');
        window.location.href = "https://www.google.com";
    };
});
let socket;

document.getElementById('settings').style.display = 'none';

document.getElementById("toolbar").style.display = 'none';
document.getElementById("authCreate").style.display = 'none';
document.getElementById("ui").style.display = 'none';

document.getElementById("loginButton").addEventListener("click", function() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const ip = '127.0.0.1';
    const action = "login";

    if (username && password) {
        sendWebSocketRequest([ip, username, password, action]);
    } else {
        document.getElementById('errorMessage').innerText = "Ім'я користувача та пароль не можуть бути порожніми.";
    }
});

document.getElementById("createAccountButton").addEventListener("click", function() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const ip = '127.0.0.1';
    const action = "create_account";

    if (username && password) {
        sendWebSocketRequest([ip, username, password, action]);
    } else {
        document.getElementById('errorMessage').innerText = "Ім'я користувача та пароль не можуть бути порожніми.";
    }
});

document.getElementById("forumLink").addEventListener("click", function() {
    document.getElementById("forumContainer").style.display = 'block';
    initializeChatSocket();
});

document.getElementById("sendMessageButton").addEventListener("click", function() {
    const message = document.getElementById("chatMessage").value;
    const username = document.getElementById("userDisplay").innerText;
    if (message) {
        sendChatMessage(username, message);
        document.getElementById("chatMessage").value = '';
    }
});

function sendWebSocketRequest(data) {
    socket = new WebSocket("https://ctservermodernversion.onrender.com/");

    socket.onopen = function() {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify(data));
    };

    socket.onmessage = function(event) {
        try {
            const response = JSON.parse(event.data);
            document.getElementById('errorMessage').innerText = response.message || response;
            if (response.message === "Логін успішний!") {
                document.getElementById('auth').style.display = 'none';
                document.getElementById('toolbar').style.display = 'flex';
                document.getElementById('userDisplay').innerText = data[1];
                document.querySelector('h3').innerText = data[1];
                document.getElementById("ui").style.display = 'block';
            } else if (response.message === "Акаунт створено успішно!") {
                document.getElementById('auth').style.display = 'none';
                document.getElementById('toolbar').style.display = 'flex';
                document.getElementById('userDisplay').innerText = data[1];
                document.querySelector('h3').innerText = data[1];
                document.getElementById("ui").style.display = 'block';
            }
        } catch (e) {
            console.log('something went wrong');
        }
    };

    socket.onerror = function(error) {
        document.getElementById('errorMessage').innerText = "WebSocket error: " + error.message;
    };

    socket.onclose = function() {
        console.log("WebSocket connection closed");
    };
}

function initializeChatSocket() {
    socket = new WebSocket("https://ctservermodernversion.onrender.com/");

    socket.onopen = function() {
        socket.send(JSON.stringify({ action: "load_chat_history" }));
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
            const chatHistory = document.getElementById("chatHistory");
            chatHistory.innerHTML = '';
            data.forEach(msg => {
                const p = document.createElement("p");
                p.textContent = `${msg.username}: ${msg.message}`;
                chatHistory.appendChild(p);
            });
        } else if (data.username && data.message) {
            updateChat(data.username, data.message);
        }
    };

    socket.onerror = function(error) {
        console.error("WebSocket error: " + error.message);
    };

    socket.onclose = function() {
        console.log("WebSocket connection closed");
    };
}

function sendChatMessage(username, message) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "send_message", username: username, message: message }));
    }
}

function updateChat(username, message) {
    const chatHistory = document.getElementById("chatHistory");
    const p = document.createElement("p");
    p.textContent = `${username}: ${message}`;
    chatHistory.appendChild(p);
    chatHistory.scrollTop = chatHistory.scrollHeight;  // Автопрокрутка до останнього повідомлення
}
document.getElementById('menuLink').addEventListener('click',function() {
    document.getElementById('forumContainer').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
    document.getElementById('ui').style.display = 'block'
})
document.getElementById('partnerLink').addEventListener('click',function() {
    window.location.href = "https://roman-talk.onrender.com/";
})
document.getElementById('settingsLink').addEventListener('click',function() {
    document.getElementById('ui').style.display = 'none';
    document.getElementById('forumContainer').style.display = 'none';
    document.getElementById('settings').style.display = 'block';


    
})
function get_isc() {
    const ip = '127.0.0.1';
    const action = "get_isc";
    
    // Створення з'єднання WebSocket
    const socket = new WebSocket("https://ctservermodernversion.onrender.com/");

    socket.onopen = function() {
        
        socket.send(JSON.stringify([ip, '', '', action]));
    };

    socket.onmessage = function(event) {
        try {
            const response = JSON.parse(event.data);
    
            if (response.isc_value !== undefined) {
                alert("ІКС: " + response.isc_value);
            } else {
                console.log("Отримане повідомлення не містить значення ІКС.");
            }
        } catch (e) {
            console.error("Помилка при обробці повідомлення від сервера:", e);
        }
    };
    

    socket.onerror = function(error) {
        console.error("WebSocket error: " + error.message);
    };

    socket.onclose = function() {
        console.log("WebSocket з'єднання закрито");
    };
}
