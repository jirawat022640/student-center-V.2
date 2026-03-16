// วาง URL ของ Web App Google Apps Script ที่นี่
const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec"; 

let html5QrCode;
let isScanning = false;

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const resultContainer = document.getElementById('result-container');
const scannedResult = document.getElementById('scanned-result');
const statusBadge = document.getElementById('status-badge');
const beepSound = document.getElementById('beep-sound');
const cameraPlaceholder = document.getElementById('camera-placeholder');

const subjectSelect = document.getElementById('subject-id');
const assignmentSelect = document.getElementById('assignment-id');

// โหลดข้อมูล Dropdown เมื่อเข้าหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
    html5QrCode = new Html5Qrcode("reader");
    loadDropdownOptions();
});

async function loadDropdownOptions() {
    try {
        // โหลดวิชา
        const subRes = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getSubjects' }) });
        const subData = await subRes.json();
        if (subData.status === 'success') {
            subjectSelect.innerHTML = '<option value="">-- เลือกวิชา --</option>';
            subData.data.forEach(s => subjectSelect.innerHTML += `<option value="${s.subject_id}">${s.subject_id} (${s.subject_name})</option>`);
        }

        // โหลดชิ้นงาน
        const assRes = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getAssignments' }) });
        const assData = await assRes.json();
        if (assData.status === 'success') {
            assignmentSelect.innerHTML = '<option value="">-- เลือกชิ้นงาน --</option>';
            assData.data.forEach(a => assignmentSelect.innerHTML += `<option value="${a.assignment_id}">${a.assignment_id} (${a.assignment_name})</option>`);
        }
    } catch (error) {
        console.error("Error loading options", error);
        subjectSelect.innerHTML = '<option value="">เกิดข้อผิดพลาดในการโหลด</option>';
        assignmentSelect.innerHTML = '<option value="">เกิดข้อผิดพลาดในการโหลด</option>';
    }
}

function startCamera() {
    if (!subjectSelect.value || !assignmentSelect.value) {
        alert("กรุณาเลือก รหัสวิชา และ รหัสงาน จากกล่องตัวเลือกก่อนเปิดกล้องสแกนครับ");
        return;
    }

    resultContainer.classList.add('hidden');
    cameraPlaceholder.style.display = 'none';

    const config = { fps: 30, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
        .then(() => {
            isScanning = true;
            btnStart.classList.add('hidden');
            btnStop.classList.remove('hidden');
        })
        .catch((err) => {
            console.error("Error starting camera", err);
            alert("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องครับ");
            cameraPlaceholder.style.display = 'flex';
        });
}

function stopCamera() {
    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            btnStart.classList.remove('hidden');
            btnStop.classList.add('hidden');
            cameraPlaceholder.style.display = 'flex';
        }).catch((err) => console.error(err));
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    stopCamera();
    beepSound.play().catch(e => console.log("ข้ามไฟล์เสียง"));

    resultContainer.classList.remove('hidden');
    scannedResult.innerText = decodedText;

    statusBadge.innerText = "กำลังส่งข้อมูลไปยังฐานข้อมูล...";
    statusBadge.className = "inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 mt-2 animate-pulse";

    const payload = {
        action: 'recordScore',
        student_id: decodedText,
        subject_id: subjectSelect.value,
        assignment_id: assignmentSelect.value
    };

    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await response.json();

        if (result.status === 'success') {
            statusBadge.innerText = "✅ บันทึกคะแนนสำเร็จ!";
            statusBadge.className = "inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700 mt-2";
            
            setTimeout(() => { startCamera(); }, 2000);
        } else {
            statusBadge.innerText = "❌ เกิดข้อผิดพลาด: " + result.message;
            statusBadge.className = "inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 mt-2";
        }
    } catch (error) {
        statusBadge.innerText = "❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
        statusBadge.className = "inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 mt-2";
    }
}

btnStart.addEventListener('click', startCamera);
btnStop.addEventListener('click', stopCamera);