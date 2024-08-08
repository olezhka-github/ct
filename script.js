let serverData = ''; // Глобальна змінна для збереження даних з WebSocket
let errorMessage = ''; // Глобальна змінна для збереження повідомлення про помилку

document.getElementById("createAccountButton").addEventListener("click", function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const action = "create";

    if (username && password) {
        sendWebSocketRequest({ username, password, action });
    } else {
        document.getElementById('errorMessage').innerText = "Username and password cannot be empty.";
    }
});

document.getElementById("loginButton").addEventListener("click", function() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const action = "login";

    if (username && password) {
        sendWebSocketRequest({ username, password, action });
    } else {
        document.getElementById('errorMessage').innerText = "Username and password cannot be empty.";
    }
});

function sendWebSocketRequest(data) {
    // Оновлено для підключення до Render сервера
    const socket = new WebSocket("https://ctserver.onrender.com");

    socket.onopen = function() {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify(data));
    };

    socket.onmessage = function(event) {
        console.log("Received data from server: " + event.data);
        serverData = event.data; // Збереження даних у глобальну змінну
        document.getElementById('errorMessage').innerText = '';
        document.getElementById('serverDataOutput').innerText = serverData;
    };

    socket.onerror = function(error) {
        console.log("WebSocket error: " + error);
        errorMessage = "WebSocket error: " + error.message;
        document.getElementById('errorMessage').innerText = errorMessage;
    };

    socket.onclose = function() {
        console.log("WebSocket connection closed");
        if (serverData === '') {
            errorMessage = "WebSocket connection closed before receiving data.";
            document.getElementById('errorMessage').innerText = errorMessage;
        }
    };
}

function showInfo() {
    document.getElementById('info').style.display = 'block';
    document.getElementById('scomContent').style.display = 'none';
    document.getElementById('newContent').style.display = 'none';
}

function showSCOM() {
    document.getElementById('info').style.display = 'none';
    document.getElementById('scomContent').style.display = 'block';
    document.getElementById('newContent').style.display = 'none';
    document.getElementById('serverDataOutput').innerText = serverData; // Відображення збережених даних
    document.getElementById('errorMessage').innerText = errorMessage; // Відображення повідомлення про помилку
}

function clearScreen() {
    document.getElementById('info').style.display = 'none';
    document.getElementById('scomContent').style.display = 'none';
    document.getElementById('newContent').style.display = 'block';
    document.getElementById('visualResponse').innerText = serverData; // Відображення збережених даних
}

function showProfile() {
    document.getElementById('info').style.display = 'none';
    document.getElementById('scomContent').style.display = 'none';
    document.getElementById('newContent').style.display = 'none';
    
    let profileContent = `<h3>Your Profile</h3><ul>`;
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    accounts.forEach(account => {
        profileContent += `<li>${account.username}</li>`;
    });
    profileContent += `</ul><button onclick="showSCOM()">Return</button>`;
    
    document.getElementById('profileContent').innerHTML = profileContent;
    document.getElementById('profileContent').style.display = 'block';
}

function showSettings() {
    alert("Settings section will be implemented soon!");
}

function connectDiscord() {
    window.open("https://discord.gg/xRkNzz7Gvy", "_blank");
}
