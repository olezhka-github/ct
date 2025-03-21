const avatarPaths = {}
const wsUrl = "ws://127.0.0.1:2573/";
const NonWsUrl = 'http://127.0.0.1:2573/'
function avjs() {
  // Об'єкт для збереження шляхів до аватарів за юзернеймом

function GET_AVATARS() {
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            action: 'sget_static_avatars',
            a: 'avjs'
        }));
    };

    ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log(response);

        if (response.action === 'get_static_avatars' && response.success) {
            response.avatars.forEach(avatar => {
                // Форматуємо шлях до аватара
                //const formattedPath = wsUrl + avatar.static_avatar;
                const formattedPath = avatar.static_avatar;

                // Запам'ятовуємо шлях до аватара за юзернеймом
                avatarPaths[avatar.username] = formattedPath;

                // Можеш показати повідомлення тут, або зберігати шляхи для подальшого використання
                // Наприклад:
                //displayMessage(avatar.username, "Avatar loaded", null, formattedPath);
            });
        }
    };
}

GET_AVATARS();

}

avjs()







/*****************************************************************
 *          Функції шифрування/дешифрування через Web Crypto        *
 *****************************************************************/
// Перетворення ArrayBuffer в Base64 та навпаки
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach(b => binary += String.fromCharCode(b));
  return window.btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// RSA: генерація ключової пари, шифрування/дешифрування
async function generateRSAKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );
}
async function encryptWithRSA(message, publicKey) {
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    enc.encode(message)
  );
  return arrayBufferToBase64(ciphertext);
}
async function decryptWithRSA(encryptedBase64, privateKey) {
  const ctBuffer = base64ToArrayBuffer(encryptedBase64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    ctBuffer
  );
  return new TextDecoder().decode(decrypted);
}

// AES-GCM для групового чату (симетричне шифрування)
async function getGroupKey() {
  const passphrase = "group_chat_secret";
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("group_chat_salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encryptWithAES(message, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(message)
  );
  return {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext)
  };
}
async function decryptWithAES(encryptedObj, key) {
  const { iv, ciphertext } = encryptedObj;
  const ivBuffer = base64ToArrayBuffer(iv);
  const ctBuffer = base64ToArrayBuffer(ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    key,
    ctBuffer
  );
  return new TextDecoder().decode(decrypted);
}

/*****************************************************************
 *               Допоміжна функція для перевірки JSON               *
 *****************************************************************/
function isEncryptedMessage(message) {
  try {
    const parsed = JSON.parse(message);
    return parsed.iv && parsed.ciphertext;
  } catch (e) {
    return false;
  }
}

/*****************************************************************
 *           Глобальні змінні та ініціалізація даних              *
 *****************************************************************/
let ws;
let currentUsername;
let currentPrefix = "";
let currentVideoAvatar = "";
let currentStaticAvatar = "";
let clientIP = "";
let myKeyPair = null;  // RSA ключова пара користувача
let groupKey = null;   // AES ключ для групового чату

// Додатково — кеш для аватарок інших користувачів та колбеки
let userAvatarCache = {};
let userAvatarCallbacks = {};

// Функція для отримання аватару користувача
function fetchUserAvatar(username) {
  return new Promise((resolve, reject) => {
    if (userAvatarCache[username]) {
      resolve(userAvatarCache[username]);
    } else {
      userAvatarCallbacks[username] = resolve;
      ws.send(JSON.stringify({ action: 'get_profile', username: username, target: username, ip: clientIP }));
    }
  });
}

// Отримання IP-адреси клієнта
fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    clientIP = data.ip;
    console.log('Клієнтський IP:', clientIP);
  })
  .catch(error => console.error('Помилка отримання IP:', error));

/*****************************************************************
 *              DOM-елементи та налаштування інтерфейсу             *
 *****************************************************************/
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const privateSection = document.getElementById('private-section');
const profileSection = document.getElementById('profile-section');
const prefixSection = document.getElementById('prefix-section');
const messagesDiv = document.getElementById('messages');
const messagesP = document.getElementById('messagesP');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const sendButton = document.getElementById('send-button');
const stickerButton = document.getElementById('sticker-button');
const userWelcome = document.getElementById('user-welcome');
const radioSectionDiv = document.getElementById('radio-section');
const sendPrivate = document.getElementById('send-private');
const prvmsg = document.getElementById('prvamsg');
const chosenUser = document.getElementById('chosen-user');
const profileUsername = document.getElementById('profile-username');
const profileAbout = document.getElementById('profile-about');
const editAbout = document.getElementById('edit-about');
const saveAbout = document.getElementById('save-about');
const banRadio = document.getElementById('ban-radio');
const admin = document.getElementById('adminpanelen');
const usernameToBan = document.getElementById('usernameToBan');
const savePrefixBtn = document.getElementById('save-prefix');
const checkboxUsers = document.getElementById('checkbox-users');

const videoAvatarUpload = document.getElementById('video-avatar-upload');
const videoAvatarPreview = document.getElementById('video-avatar-preview');
const saveVideoAvatarButton = document.getElementById('save-video-avatar');

const staticAvatarUpload = document.getElementById('static-avatar-upload');
const staticAvatarPreview = document.getElementById('static-avatar-preview');
const saveStaticAvatarButton = document.getElementById('save-static-avatar');

// Початкове приховування секцій
privateSection.style.display = 'none';
profileSection.style.display = 'none';
prefixSection.style.display = 'none';

// WebSocket URL – використання wss:// для безпечного з'єднання

// Формуємо базовий HTTP URL із wsUrl (ws:// → http://)
const BASE_URL = wsUrl.replace("ws://", "http://");

/*****************************************************************
 *          Логіка перемикання режимів інтерфейсу через radio         *
 *****************************************************************/
document.querySelectorAll('input[name="radio"]').forEach(radio => {
  radio.addEventListener('change', function () {
    const selectedValue = document.querySelector('input[name="radio"]:checked').value;
    chatSection.style.display = 'none';
    privateSection.style.display = 'none';
    profileSection.style.display = 'none';
    prefixSection.style.display = 'none';
    admin.style.display = 'none';
    if (selectedValue === "forum") {
      chatSection.style.display = 'flex';
    } else if (selectedValue === "private") {
      privateSection.style.display = 'flex';
    } else if (selectedValue === "profile") {
      profileSection.style.display = 'flex';
      loadProfile();
    } else if (selectedValue === "prefix") {
      prefixSection.style.display = 'flex';
    } else if (selectedValue === "bans") {
      admin.style.display = 'flex';
    }
  });
});

/*****************************************************************
 *            Збереження та оновлення префіксу користувача         *
 *****************************************************************/
savePrefixBtn.addEventListener('click', () => {
  const selected = document.querySelector('input[name="prefix"]:checked');
  if (selected) {
    currentPrefix = selected.value;
    alertify.success('Префікс збережено: ' + (currentPrefix ? currentPrefix : "(без префіксу)"));
  } else {
    alertify.error('Оберіть префікс');
  }
});

/*****************************************************************
 *      Завантаження та збереження відео та статичного аватару      *
 *****************************************************************/
videoAvatarUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const videoURL = URL.createObjectURL(file);
    videoAvatarPreview.src = videoURL;
    videoAvatarPreview.style.display = 'block';
    currentVideoAvatar = videoURL;
  }
});
saveVideoAvatarButton.addEventListener('click', () => {
  if (currentVideoAvatar) {
    alertify.success("Відео аватар збережено!");
    // Додайте логіку для відправки відео на сервер за потребою
  } else {
    alertify.error("Спочатку виберіть відео");
  }
});
staticAvatarUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const imageURL = URL.createObjectURL(file);
    staticAvatarPreview.src = imageURL;
    staticAvatarPreview.style.display = 'block';
  }
});
saveStaticAvatarButton.addEventListener('click', () => {
  if (staticAvatarUpload.files.length > 0) {
    const file = staticAvatarUpload.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      const fileData = event.target.result; // base64 рядок
      const message = {
        action: 'upload_static_avatar',  // тип повідомлення для серверної логіки
        username: currentUsername,
        fileName: file.name,
        fileType: file.type,
        avatar: fileData, // base64 зображення
      };
      ws.send(JSON.stringify(message));
    };
    reader.onerror = function(err) {
      console.error(err);
      alertify.error("Помилка зчитування файлу");
    };
    reader.readAsDataURL(file);
  } else {
    alertify.error("Спочатку виберіть зображення");
  }
});

/*****************************************************************
 *               Реєстрація та вхід користувача                      *
 *****************************************************************/
registerButton.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    alertify.error('Введіть дані для реєстрації');
    return;
  }
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ 
      action: 'create_account', 
      username, 
      password,
      ip: clientIP
    }));
  };
  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    if (response.action === 'createAccount') {
      if (response.success) {
        alertify.success('Ви зареєструвались, тепер можете увійти.');
      } else {
        alertify.error(response.message || 'Помилка реєстрації');
      }
    }
  };
  ws.onerror = (error) => console.error('WS error:', error);
});

loginButton.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) {
    alertify.error('Введіть коректні дані для входу');
    return;
  }
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ 
      action: 'login', 
      username, 
      password,
      ip: clientIP
    }));
  };
  ws.onmessage = async (event) => {
    const response = JSON.parse(event.data);
    console.log(response);
    if (response.action === 'login') {
      if (response.success) {
        currentUsername = username;
        loginSection.style.display = 'none';
        chatSection.style.display = 'block';
        radioSectionDiv.style.display = 'flex';
        userWelcome.textContent = currentUsername;
        profileUsername.textContent = currentUsername;
        if (['hideyoshi.xaotiq', 'moderator.roman'].includes(currentUsername)) {
          banRadio.classList.remove('hidden');
        } else {
          if(banRadio.parentNode) banRadio.parentNode.removeChild(banRadio);
          if(admin.parentNode) admin.parentNode.removeChild(admin);
        }
        loadFriendList();
        // Ініціалізуємо groupKey перед завантаженням історії чату
        if (!groupKey) {
          groupKey = await getGroupKey();
        }
        loadChatHistory();
        if (!myKeyPair) {
          myKeyPair = await generateRSAKeyPair();
          const exportedPublicKey = await crypto.subtle.exportKey("jwk", myKeyPair.publicKey);
          ws.send(JSON.stringify({action:'rpk',username: currentUsername, publicKey: exportedPublicKey}));
        }
      } else {
        alertify.error(response.message);
      }
    }
    else if (response.action === 'new_message') {
      if (response.type === 'sticker') {
        displaySticker(response.username, response.stickerUrl);
      } else {
        // Перевіряємо, чи є повідомлення зашифрованим
        if (response.encryption === 'group' || isEncryptedMessage(response.message.trim())) {
          try {
            const encryptedObj = JSON.parse(response.message.trim());
            const decryptedText = await decryptWithAES(encryptedObj, groupKey);
            displayMessage(response.username, decryptedText, response.prefix, response.staticAvatar);
          } catch (err) {
            console.error('Помилка дешифрування групового повідомлення:', err);
          }
        } else {
          displayMessage(response.username, response.message, response.prefix, response.staticAvatar);
        }
      }
    }
    // Обробка завантаження історії чату з розшифруванням "на льоту"
    else if (response.action === 'loadChatHistory') {
      (async () => {
        for (const msg of response.chatHistory) {
          if (msg.type === 'message') {
            if (isEncryptedMessage(msg.message.trim())) {
              try {
                const encryptedObj = JSON.parse(msg.message.trim());
                const decryptedText = await decryptWithAES(encryptedObj, groupKey);
                displayMessage(msg.username, decryptedText, msg.prefix, msg.staticAvatar);
              } catch (err) {
                console.error('Помилка дешифрування історії:', err, 'Оригінал:', msg.message);
                displayMessage(msg.username, "⚠️ Помилка розшифрування", msg.prefix, msg.staticAvatar);
              }
            } else {
              displayMessage(msg.username, msg.message, msg.prefix, msg.staticAvatar);
            }
          } else if (msg.type === 'sticker') {
            displaySticker(msg.username, msg.stickerUrl);
          }
        }
      })();
    }
    else if (response.action === 'private_message') {
      if (response.recipient === currentUsername) {
        try {
          const decryptedText = await decryptWithRSA(response.message, myKeyPair.privateKey);
          displayPrivate(response.from, decryptedText, response.staticAvatar);
        } catch (err) {
          console.error('Помилка дешифрування приватного повідомлення:', err);
        }
      }
    }
    else if (response.action === 'get_profile') {
      if (response.target) {
        userAvatarCache[response.target] = response.staticAvatar;
        if (userAvatarCallbacks[response.target]) {
          userAvatarCallbacks[response.target](response.staticAvatar);
          delete userAvatarCallbacks[response.target];
        }
      } else {
        if (response.success) {
          profileAbout.textContent = 'Про себе = ' + (response.about || 'Немає інформації');
          editAbout.value = response.about || '';
        } else {
          profileAbout.textContent = 'Помилка завантаження профілю';
        }
      }
    }
    else if (response.action === 'update_profile') {
      if (response.success) {
        profileAbout.textContent = 'Про себе = ' + (response.about || 'Немає інформації');
        alertify.success('Профіль оновлено');
      } else {
        alertify.error(response.message);
      }
    }
    else if (response.action === 'loadUserList') {
      loadUserList(response.users);
    }
  };
  ws.onerror = (error) => console.error('WS error:', error);
});

/*****************************************************************
 *               Надсилання повідомлень у загальний чат               *
 *****************************************************************/
sendButton.addEventListener('click', async () => {
  const message = document.getElementById('message').value.trim();
  if (message) {
    try {
      const encryptedObj = await encryptWithAES(message, groupKey);
      ws.send(JSON.stringify({ 
        action: 'send_message', 
        username: currentUsername, 
        message: JSON.stringify(encryptedObj),
        encryption: 'group',
        prefix: currentPrefix,
        staticAvatar: currentStaticAvatar,
        ip: clientIP
      }));
      document.getElementById('message').value = '';
    } catch (err) {
      console.error('Помилка шифрування групового повідомлення:', err);
    }
  }
});

/*****************************************************************
 *                Надсилання приватного повідомлення                 *
 *****************************************************************/
document.getElementById('checkbox-users').addEventListener('change', function() {
  document.getElementById('chosen-user').textContent = this.value;
});
sendPrivate.addEventListener('click', async () => {
  const message = document.getElementById('prvamsg').value.trim();
  const recipient = document.getElementById('chosen-user').textContent.trim();
  if (message && recipient) {
    try {
      const res = await fetch('/public_key/' + recipient);
      if (!res.ok) {
        alertify.error('Не вдалося отримати публічний ключ');
        return;
      }
      const data = await res.json();
      const recipientPublicKey = await crypto.subtle.importKey(
        "jwk",
        data.publicKey,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
      );
      const encryptedMessage = await encryptWithRSA(message, recipientPublicKey);
      ws.send(JSON.stringify({ 
        action: 'private_message', 
        username: currentUsername, 
        recipient, 
        message: encryptedMessage,
        encryption: 'rsa',
        prefix: currentPrefix,
        staticAvatar: currentStaticAvatar,
        ip: clientIP
      }));
      displayPrivate(currentUsername, message, currentStaticAvatar);
      document.getElementById('prvamsg').value = '';
    } catch (err) {
      console.error('Помилка шифрування приватного повідомлення:', err);
      alertify.error('Не вдалося зашифрувати повідомлення');
    }
  } else {
    alertify.error('Оберіть користувача та напишіть повідомлення');
  }
});

/*****************************************************************
 *             Функції відображення повідомлень та стікерів          *
 *****************************************************************/
// Оновлена функція відображення повідомлення з аватаром користувача
// Оновлена функція відображення повідомлення з аватаром користувача
function displayMessage(username, message, prefix, avatar) {
  const p = document.createElement('p');
  const avatarContainer = document.createElement('span');

  if (username === currentUsername) {
    if (currentVideoAvatar) {
      const videoEl = document.createElement('video');
      videoEl.src = currentVideoAvatar;
      videoEl.width = 50;
      videoEl.height = 50;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.style.marginRight = "5px";
      avatarContainer.appendChild(videoEl);
    } else if (currentStaticAvatar) {
      const img = document.createElement('img');
      img.src = currentStaticAvatar;
      img.width = 50;
      img.height = 50;
      img.style.marginRight = "5px";
      avatarContainer.appendChild(img);
    } else {
      // If no avatar is set, show the default avatar
      const img = document.createElement('img');
      img.src = 'default-avatar.png';
      img.width = 50;
      img.height = 50;
      img.style.marginRight = "5px";
      avatarContainer.appendChild(img);
    }
  } else {
    const img = document.createElement('img');
    img.width = 50;
    img.height = 50;
    img.style.marginRight = "5px";

    if (avatar) {
      img.src = avatar;
    } else if (avatarPaths[username]) {
      img.src = NonWsUrl + avatarPaths[username];
    } else {
      img.src = 'default-avatar.png';
      // Fetch the avatar if not in the cache, then update the image
      fetchUserAvatar(username).then((fetchedAvatar) => {
        img.src = fetchedAvatar ? BASE_URL + fetchedAvatar : 'default-avatar.png';
        if (fetchedAvatar) {
          avatarPaths[username] = BASE_URL + fetchedAvatar;
        }
      }).catch(err => console.error('Error fetching avatar for ' + username, err));
    }
    avatarContainer.appendChild(img);
  }

  let displayName = username;
  if (prefix && prefix.trim() !== "") {
    displayName = prefix + " " + username;
  }
  avatarContainer.appendChild(document.createTextNode(`${displayName}: ${message}`));
  p.appendChild(avatarContainer);
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// Оновлена функція відображення приватного повідомлення
function displayPrivate(from, message, avatar) {
  const p = document.createElement('p');
  const avatarContainer = document.createElement('span');

  const img = document.createElement('img');
  img.width = 50;
  img.height = 50;
  img.style.marginRight = "5px";

  if (from === currentUsername) {
    if (currentVideoAvatar) {
      const videoEl = document.createElement('video');
      videoEl.src = currentVideoAvatar;
      videoEl.width = 50;
      videoEl.height = 50;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.style.marginRight = "5px";
      avatarContainer.appendChild(videoEl);
    } else if (currentStaticAvatar) {
      img.src = BASE_URL + currentStaticAvatar;
      avatarContainer.appendChild(img);
    }
  } else {
    if (avatar) {
      img.src = BASE_URL + avatar;
      avatarContainer.appendChild(img);
    } else {
      img.src = 'default-avatar.png';
      avatarContainer.appendChild(img);
      fetchUserAvatar(from).then(fetchedAvatar => {
        img.src = fetchedAvatar ? BASE_URL + fetchedAvatar : 'default-avatar.png';
      }).catch(err => console.error('Помилка отримання аватару для ' + from, err));
    }
  }
  let displayName = (from === currentUsername) ? "Ви" : from;
  avatarContainer.appendChild(document.createTextNode(`${displayName}: ${message}`));
  p.appendChild(avatarContainer);
  messagesP.appendChild(p);
  messagesP.scrollTop = messagesP.scrollHeight;
}

/*****************************************************************
 *               Завантаження списку користувачів та історії         *
 *****************************************************************/
function loadFriendList() {
  ws.send(JSON.stringify({ 
    action: 'loadUserList', 
    username: currentUsername,
    ip: clientIP
  }));
}
function loadUserList(users) {
  usernameToBan.innerHTML = '';
  checkboxUsers.innerHTML = '';
  users.forEach(user => {
    const banOption = document.createElement('option');
    banOption.id = user;
    banOption.value = user;
    banOption.text = user;
    usernameToBan.appendChild(banOption);
    const opt = document.createElement('option');
    opt.value = user;
    opt.text = user;
    checkboxUsers.appendChild(opt);
  });
}
function loadChatHistory() {
  ws.send(JSON.stringify({ 
    action: 'loadChatHistory', 
    username: currentUsername,
    ip: clientIP
  }));
}
function loadProfile() {
  if (ws && currentUsername) {
    ws.send(JSON.stringify({ 
      action: 'get_profile', 
      username: currentUsername,
      ip: clientIP
    }));
  }
}

/*****************************************************************
 *              Оновлення профілю користувача                       *
 *****************************************************************/
saveAbout.addEventListener('click', () => {
  const aboutText = editAbout.value.trim();
  ws.send(JSON.stringify({
    action: 'update_profile',
    username: currentUsername,
    about: aboutText,
    ip: clientIP
  }));
});

/*****************************************************************
 *                    Адмін-функції бану                           *
 *****************************************************************/
function TryToBanUser() {
  const sel_val = usernameToBan.value.trim();
  if (sel_val === 'hideyoshi.xaotiq') {
    alertify.error('Ви не маєте права блокувати цього користувача.');
    return;
  }
  const tokenprompt = prompt('Введіть токен взаємодії');
  const resn = prompt('Введіть причину');
  ws.send(JSON.stringify({ 
    action: 'ban_user', 
    username: sel_val, 
    duration: 10, 
    token: tokenprompt, 
    reason: resn, 
    banned_by: currentUsername,
    ip: clientIP
  }));
}

/*****************************************************************
 *         Перехоплення кліків за посиланнями (HTTPS редирект)       *
 *****************************************************************/
document.addEventListener('click', function(e) {
  const anchor = e.target.closest('a');
  if (anchor) {
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('https://')) {
      e.preventDefault();
      window.location.href = '/redirect?s=' + encodeURIComponent(href);
    }
  }
});
