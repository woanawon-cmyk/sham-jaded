import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyBwkfW26EAPTiupO6mRejVcKMbpJZV1ohE",
    authDomain: "shahame-98a21.firebaseapp.com",
    databaseURL: "https://shahame-98a21-default-rtdb.firebaseio.com",
    projectId: "shahame-98a21",
    storageBucket: "shahame-98a21.firebasestorage.app",
    messagingSenderId: "885951504437",
    appId: "1:885951504437:web:55b4d335c9418ba376517c"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const requestForm = document.getElementById('requestForm');
const messageDiv = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const qrButton = document.getElementById('qrButton');

requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const name = document.getElementById('name').value.trim();
    const orderNumber = createOrderNumber();

    submitButton.disabled = true;
    submitButton.textContent = 'جاري الإرسال...';

    try {
        const requestsRef = ref(database, 'requests');
        const newRequestRef = push(requestsRef);

        await set(newRequestRef, {
            email,
            name,
            orderNumber,
            status: 'pending',
            timestamp: Date.now(),
            date: new Date().toLocaleString('ar-EG')
        });

        showMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${orderNumber}`, 'success');
        requestForm.reset();
    } catch (error) {
        showMessage('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى', 'error');
        console.error('Error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'تقديم الطلب';
    }
});

qrButton.addEventListener('click', () => {
    showMessage('زر المسح غير مفعل حاليا. يمكنك تقديم الطلب من النموذج.', 'error');
});

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
}

function createOrderNumber() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
