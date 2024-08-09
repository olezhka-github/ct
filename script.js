let serverData = ''; // Глобальна змінна для збереження даних з WebSocket
let errorMessage = ''; // Глобальна змінна для збереження повідомлення про помилку
document.getElementById('settingsMenu').style.display = 'none';

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
    const socket = new WebSocket("https://ctserver.onrender.com/");

    socket.onopen = function() {
        console.log("WebSocket connection established");
        socket.send(JSON.stringify(data));
    };

    socket.onmessage = function(event) {
        const response = JSON.parse(event.data);
        console.log("Received data from server: " + response.message || response);
        document.getElementById('serverDataOutput').innerText = response.message || response;

        if (response.role === 'admin') {
            document.getElementById('addMoneyButton').style.display = 'block';
        }
    };

    socket.onerror = function(error) {
        console.log("WebSocket error: " + error);
        document.getElementById('errorMessage').innerText = "WebSocket error: " + error.message;
    };

    socket.onclose = function() {
        console.log("WebSocket connection closed");
    };
}

function showAddMoney() {
    document.getElementById('addMoneyContent').style.display = 'block';
}

function addMoney() {
    const targetUsername = document.getElementById("targetUsername").value;
    const add_uah = parseFloat(document.getElementById("amountToAdd").value);

    const data = {
        action: "add_money",
        username: "olezhkaadmin",
        target_username: targetUsername,
        add_uah: add_uah
    };

    sendWebSocketRequest(data);
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

function showSettings() {
    document.getElementById('info').style.display = 'none';
    document.getElementById('scomContent').style.display = 'none';
    document.getElementById('newContent').style.display = 'none';
    document.getElementById('visualResponse').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('congrats').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'block';
}

function eula() {
    alert('я повідомлення');
}

function menuScript() {
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('congrats').style.display = 'block';
    document.getElementById('settingsMenu').style.display = 'none';
    document.getElementById('info').style.display = 'none';
    document.getElementById('scomContent').style.display = 'none';
    document.getElementById('newContent').style.display = 'none';
    document.getElementById('visualResponse').style.display = 'none';
}

function connectDiscord() {
    window.open("https://discord.gg/xRkNzz7Gvy", "_blank");
}
