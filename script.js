const auth = document.getElementById('auth');
const tl = document.getElementById('tl');
const info = document.getElementById('info');
const src = document.getElementById('src');
const promoCodeInput = document.getElementById('promoCode');
const randomNumberField = document.getElementById('randomNumber');

const VALID_PROMO_CODE = "VALID_PROMO_CODE";  // Промокод для перевірки

// Функція для отримання значення cookie
function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");
        if (name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

function submit() {
    auth.style.display = 'none';  // Ховаємо форму авторизації
    tl.style.display = 'block';   // Показуємо тулбар
}

function infoFunc() {
    info.style.display = 'block';
}

function srcFunc() {
    info.style.display = 'none';
    src.style.display = 'block';  // Показуємо форму створення номера

    // Перевіряємо чи є номер в cookies
    let savedNumber = getCookie('srcNumber');
    if (savedNumber) {
        randomNumberField.innerText = `Ваш збережений номер: ${savedNumber}`;
    } else {
        randomNumberField.innerText = 'Номер не збережений. Згенеруйте номер!';
    }
}

function generateRandomNumber() {
    let randomNumber = '+1200' + Math.floor(1000000 + Math.random() * 9000000);  // Генерація номера за нумерацією Commet Україна
    randomNumberField.innerText = randomNumber;
}

function saveNumber() {
    const number = randomNumberField.innerText;
    if (number.includes('+1200')) {
        document.cookie = `srcNumber=${number}; path=/;`;  // Зберігаємо в cookies
        sendToAPI(number);  // Відправляємо на API
    } else {
        alert('Спочатку згенеруйте номер!');
    }
}

function sendToAPI(number) {
    fetch('https://srcapidevverbetacommet.pythonanywhere.com/api/save-number', {  // Використовуємо повний URL до вашого API
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: number }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Номер збережено:', data);
    })
    .catch((error) => {
        console.error('Помилка збереження:', error);
    });
}
