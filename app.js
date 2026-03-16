// ==========================================
// 1. ตั้งค่าและดึง Elements จาก DOM
// ==========================================

// *** นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่ ***
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

const subjectInput = document.getElementById('subject-id');
const assignmentInput = document.getElementById('assignment-id');

// ==========================================
// 2. ฟังก์ชันควบคุมการทำงานของกล้อง
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // กำหนดให้ html5-qrcode ทำงานที่ div id="reader"
    html5QrCode = new Html5Qrcode("reader");
});

function startCamera() {
    // ตรวจสอบว่าครูกรอกรหัสวิชาและรหัสงานหรือยัง
    if (!subjectInput.value.trim() || !assignmentInput.value.trim()) {
        alert("กรุณากรอก รหัสวิชา และ รหัสงาน ก่อนเปิดกล้องสแกนครับ");
        return;
    }

    resultContainer.classList.add('hidden');
    cameraPlaceholder.style.display = 'none';

    // ตั้งค่ากล้อง: เลือกกล้องหลังเป็นหลัก (environment) 
    const config = { fps: 30, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
        .then(() => {
            isScanning = true;
            btnStart.classList.add('hidden');
            btnStop.classList.remove('hidden');
        })
        .catch((err) => {
            console.error("Error starting camera", err);
            alert("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้องบนเบราว์เซอร์ครับ");
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
        }).catch((err) => {
            console.error("Error stopping camera", err);
        });
    }
}

// ==========================================
// 3. ฟังก์ชันเมื่อสแกน QR Code สำเร็จ
// ==========================================

async function onScanSuccess(decodedText, decodedResult) {
    // หยุดกล้องทันทีเพื่อป้องกันการสแกนซ้ำซ้อนขณะกำลังส่งข้อมูล
    stopCamera();
    
    // เล่นเสียงแจ้งเตือน
    beepSound.play().catch(e => console.log("ไม่มีไฟล์เสียง ไม่เป็นไรข้ามไปทำงานต่อ"));

    // แสดงผลบนหน้าจอ
    resultContainer.classList.remove('hidden');
    scannedResult.innerText = decodedText; // แสดงรหัสนักเรียนที่ได้จาก QR

    // ตั้งค่าสถานะกำลังโหลด
    statusBadge.innerText = "กำลังส่งข้อมูลไปยังฐานข้อมูล...";
    statusBadge.className = "inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 mt-2";

    // เตรียมข้อมูลส่งไปที่ API
    const payload = {
        action: 'recordScore',
        student_id: decodedText,
        subject_id: subjectInput.value.trim(),
        assignment_id: assignmentInput.value.trim(),
        timestamp: new Date().toISOString()
    };

    try {
        // ส่ง HTTP POST Request ไปยัง Google Apps Script
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === 'success') {
            // สำเร็จ
            statusBadge.innerText = "✅ บันทึกคะแนนสำเร็จ!";
            statusBadge.className = "inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 mt-2";
            
            // เปิดกล้องอัตโนมัติเพื่อสแกนคนต่อไปหลังจากผ่านไป 2 วินาที
            setTimeout(() => {
                startCamera();
            }, 2000);

        } else {
            // เกิดข้อผิดพลาดจากฝั่ง Server
            statusBadge.innerText = "❌ เกิดข้อผิดพลาด: " + result.message;
            statusBadge.className = "inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 mt-2";
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        statusBadge.innerText = "❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
        statusBadge.className = "inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 mt-2";
    }
}

// ==========================================
// 4. ผูก Event Listener ให้กับปุ่มต่างๆ
// ==========================================

btnStart.addEventListener('click', startCamera);
btnStop.addEventListener('click', stopCamera);