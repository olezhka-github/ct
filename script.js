let socket;

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
    socket = new WebSocket("ws://127.0.0.1:2400");

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
    socket = new WebSocket("ws://127.0.0.1:2400");

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
    document.getElementById('forumContainer').style.display = 'none'
})
