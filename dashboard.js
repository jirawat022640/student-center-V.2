const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

const pinOverlay = document.getElementById('pin-overlay');
const mainContent = document.getElementById('main-content');
const pinInput = document.getElementById('pin-input');
const btnLogin = document.getElementById('btn-login');
const loginError = document.getElementById('login-error');
const statStudents = document.getElementById('stat-students');

// 1. ตรวจสอบสถานะการเข้าสู่ระบบเมื่อเปิดหน้า
document.addEventListener("DOMContentLoaded", () => {
    const isAuth = sessionStorage.getItem('teacher_auth');
    if (isAuth === 'true') {
        showDashboard();
    }
});

// 2. ฟังก์ชันล็อกอิน
async function handleLogin() {
    const pin = pinInput.value;
    if (pin.length < 4) return;

    btnLogin.disabled = true;
    btnLogin.innerText = "กำลังตรวจสอบ...";
    loginError.classList.add('hidden');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'verifyPIN', pin: pin })
        });
        const result = await response.json();

        if (result.status === 'success') {
            sessionStorage.setItem('teacher_auth', 'true');
            showDashboard();
        } else {
            loginError.classList.remove('hidden');
            pinInput.value = '';
        }
    } catch (error) {
        alert("ไม่สามารถเชื่อมต่อ API ได้");
    } finally {
        btnLogin.disabled = false;
        btnLogin.innerText = "เข้าสู่ระบบ";
    }
}

// 3. แสดงหน้า Dashboard และโหลดข้อมูลสถิติ
function showDashboard() {
    pinOverlay.classList.add('hidden');
    mainContent.classList.remove('hidden');
    loadQuickStats();
}

async function loadQuickStats() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudents' })
        });
        const result = await response.json();
        if (result.status === 'success') {
            statStudents.innerText = result.data.length;
        }
    } catch (e) {
        statStudents.innerText = "Error";
    }
}

// 4. ออกจากระบบ
function logout() {
    sessionStorage.removeItem('teacher_auth');
    location.reload();
}

btnLogin.addEventListener('click', handleLogin);
pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});