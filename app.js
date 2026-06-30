// استبدل هذه البيانات ببيانات Firebase الخاصة بك
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

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentEmail = '';
let currentName = '';

// معالجة نموذج التسجيل الأولي
const submitForm = document.getElementById('submitForm');
const requestForm = document.getElementById('requestForm');
const orderNumberForm = document.getElementById('orderNumberForm');

submitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    currentEmail = document.getElementById('email').value;
    currentName = document.getElementById('name').value;
    
    // إخفاء النموذج الأول وإظهار نموذج رقم الطلب
    requestForm.classList.add('hidden');
    orderNumberForm.classList.remove('hidden');
});

// معالجة نموذج رقم الطلب
const orderForm = document.getElementById('orderForm');
const messageDiv = document.getElementById('message');

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderNumber = document.getElementById('orderNumber').value;
    
    // التحقق من أن رقم الطلب يحتوي على 6 أرقام فقط
    if (!/^\d{6}$/.test(orderNumber)) {
        showMessage('يجب أن يكون رقم الطلب مكون من 6 أرقام فقط', 'error');
        return;
    }
    
    try {
        // حفظ البيانات في Firebase
        const requestsRef = ref(database, 'requests');
        const newRequestRef = push(requestsRef);
        
        await set(newRequestRef, {
            email: currentEmail,
            name: currentName,
            orderNumber: orderNumber,
            status: 'pending',
            timestamp: Date.now(),
            date: new Date().toLocaleString('ar-EG')
        });
        
        showMessage('تم إرسال الطلب بنجاح! سيتم مراجعته قريباً', 'success');
        
        // إعادة تعيين النماذج
        setTimeout(() => {
            submitForm.reset();
            orderForm.reset();
            orderNumberForm.classList.add('hidden');
            requestForm.classList.remove('hidden');
            messageDiv.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        showMessage('حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى', 'error');
        console.error('Error:', error);
    }
});

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
}

// السماح بإدخال الأرقام فقط في حقل رقم الطلب
document.getElementById('orderNumber').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});
