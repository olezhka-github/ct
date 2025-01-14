<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WCS Месенджер - творіння xaotiq</title>
    <link rel="icon" href="favicon.ico">
    <link rel="stylesheet" href="style.css">
    <script src="//cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/alertify.min.js"></script>
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/alertifyjs@1.14.0/build/css/alertify.min.css"/>
<body>
    

        
        <div id="login-section">
            
<div class="wrapper">
        <div class="card-switch">
            <label class="switch">
               <input type="checkbox" class="toggle">
               <span class="slider"></span>
               <span class="card-side"></span>
               <div class="flip-card__inner">
                  <div class="flip-card__front">
                     <div class="title">WCS - Вхід</div>
                     <div class="flip-card__form" action="">
                        <input class="flip-card__input" id="username" placeholder="Нікнейм" type="text">
                        <input class="flip-card__input" id="password" placeholder="Пароль" type="password">
                        <button class="flip-card__btn" id="loginButton">Ввійти</button>
                     </div>
                  </div>
                  <div class="flip-card__back">
                     <div class="title">WCS - Реєстрація</div>
                     <div class="flip-card__form" action="">
                        <input class="flip-card__input" id="usernameR" placeholder="Нікнейм" type="text">
                        <input class="flip-card__input" id="passwordR" placeholder="Пароль" type="password">
                        <button id="registerButton"class="flip-card__btn">Зареєструватись</button>
                     </div>
                  </div>
               </div>
            </label>
        </div>   
   </div>
        </div>

        <div id="chat-section" class="hidden">
            <h3>      Вітаю, <span id="user-welcome"></span>!</h3>
            <div id="chat-area">
                <div id="messages"></div>
                <input type="text" id="message" placeholder="Напиши повідомлення">
                <button id="send-button">📩</button>
                </div>
            </div>
            <div class="hidden" id="private-section">
                
                    <p>Це ще не дороблено ☹️</p>
                
            </div>
            

                        
<div class="hidden" id="radio-section">
    
    <label class="radio">
        <input type="radio" name="radio"checked="" value="forum">
        <span class="name">Форум</span>
      </label>
    <label class="radio">
      <input type="radio" name="radio" value="private">
      <span class="name">Приватні повідомлення</span>
    </label>
        
  
  
            </div>
    
        
    </div>

    <script>
        let ws;
        let currentUsername;
    
        // DOM Elements
        const loginSection = document.getElementById('login-section');
        const chatSection = document.getElementById('chat-section');
        const messagesDiv = document.getElementById('messages');
        const loginButton = document.getElementById('loginButton');
        const sendButton = document.getElementById('send-button');
        const addFriendButton = document.getElementById('add-friend-button');
        const loginError = document.getElementById('login-error');
        const userWelcome = document.getElementById('user-welcome');
        const friendsList = document.getElementById('friends-list');
        const usernameR = document.getElementById('usernameR');
        const passwordR = document.getElementById('passwordR');
        const registerButton = document.getElementById('registerButton')
        const radioSection = document.getElementById('radio-section');
        const privateSection = document.getElementById('private-section')
        privateSection.style.display = 'none'
        const radios = document.querySelectorAll('input[name="radio"]');

        // Login event

          // Додати слухач подій на зміну стану
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Перевірити, яка радіо-кнопка обрана
            const selectedValue = document.querySelector('input[name="radio"]:checked').value;
            if (selectedValue === "forum") {
                chatSection.style.display = 'flex'
                privateSection.style.display = 'none'
            }
            else {
                chatSection.style.display = 'none'
                privateSection.style.display = 'flex'
            }
        });
    });


        // Register event
        registerButton.addEventListener('click', () => {
            const username = document.getElementById('usernameR').value;
            const password = document.getElementById('passwordR').value;

            ws = new WebSocket(`https://ctserver.onrender.com/`);

            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'create_account', username: username, password: password }));
            };
            
            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                
                if (response.action === 'createAccount') {
                    
                    if (response.success) {
                        alertify.success('Ви зареєструвались,тепер ви можете ввійти.');
                        
                    } else {
                        
                        alertify.alert(response.message)
                    }
                }
            };
        });
        loginButton.addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Establish WebSocket connection
            ws = new WebSocket(`https://ctserver.onrender.com/`);

            ws.onopen = () => {
                ws.send(JSON.stringify({ action: 'login', username, password }));
            };

            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);

                if (response.action === 'login') {
                    if (response.success) {
                        currentUsername = username;
                        loginSection.classList.add('hidden');
                        chatSection.classList.remove('hidden');
                        privateSection.classList.remove('hidden');
                        radioSection.classList.remove('hidden')
                        radioSection.classList.add('radio-inputs')
                        chatSection.classList.add('gcard')
                        privateSection.classList.add('gcard')
                        userWelcome.textContent = currentUsername;
                        
                        loadFriendList();
                        loadChatHistory();
                    } else {
                        alertify.error('Помилка 129 : Невірні дані входу / сесія вже активна')
                    }
                } else if (response.action === 'new_message') {
                    displayMessage(response.username, response.message);
                } else if (response.action === 'loadFriendList') {
                    friendsList.innerHTML = '';
                    response.friends.forEach(friend => {
                        const li = document.createElement('li');
                        li.textContent = friend;
                        friendsList.appendChild(li);
                    });
                } else if (response.action === 'loadChatHistory') {
                    response.chatHistory.forEach(msg => {
                        displayMessage(msg.username, msg.message);
                    });
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        });

        // Send message event
        sendButton.addEventListener('click', () => {
            const message = document.getElementById('message').value;
            if (message.trim()) {
                ws.send(JSON.stringify({ action: 'send_message', username: currentUsername, message }));
                document.getElementById('message').value = '';
            }
        });

        // Add friend event
  //      addFriendButton.addEventListener('click', () => {
 //           const friendUsername = document.getElementById('friend-name').value;
  //          if (friendUsername.trim()) {
  //              ws.send(JSON.stringify({ action: 'addFriend', username: currentUsername, friendUsername }));
   //             document.getElementById('friend-name').value = '';
   //         }
  //      });

        // Display message in chat
        function displayMessage(username, message) {
            const p = document.createElement('p');
            p.textContent = `${username}: ${message}`;
            messagesDiv.appendChild(p);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Load friend list
        function loadFriendList() {
            ws.send(JSON.stringify({ action: 'loadFriendList', username: currentUsername }));
        }

        // Load chat history
        function loadChatHistory() {
            ws.send(JSON.stringify({ action: 'loadChatHistory' }));
        }
    </script>
</body>
</html>
