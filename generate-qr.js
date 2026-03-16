// ==========================================
// 1. ตั้งค่าและดึง Elements
// ==========================================

// *** วาง URL ของ Web App Google Apps Script ที่นี่ (อันเดียวกับหน้าแสกน) ***
const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec"; 

const btnFetch = document.getElementById('btn-fetch');
const btnPrint = document.getElementById('btn-print');
const statusMessage = document.getElementById('status-message');
const qrContainer = document.getElementById('qr-container');

// ==========================================
// 2. ฟังก์ชันดึงข้อมูลนักเรียนจาก Google Sheets
// ==========================================
async function fetchStudents() {
    // รีเซ็ตหน้าจอ
    qrContainer.innerHTML = '';
    btnFetch.disabled = true;
    btnPrint.disabled = true;
    
    statusMessage.classList.remove('hidden');
    statusMessage.className = "mt-4 text-center text-blue-600 font-medium";
    statusMessage.innerText = "กำลังดาวน์โหลดรายชื่อนักเรียนจากระบบ...";

    try {
        // ส่ง Request ไปหา API ด้วย Action 'getStudents'
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudents' })
        });

        const result = await response.json();

        if (result.status === 'success') {
            const students = result.data;
            
            if (students.length === 0) {
                statusMessage.innerText = "❌ ไม่พบรายชื่อนักเรียนในฐานข้อมูล (Sheet 'Students' ว่างเปล่า)";
                statusMessage.className = "mt-4 text-center text-red-500 font-medium";
                btnFetch.disabled = false;
                return;
            }

            statusMessage.innerText = `✅ โหลดข้อมูลสำเร็จ พบนักเรียนทั้งหมด ${students.length} คน กำลังสร้าง QR Code...`;
            statusMessage.className = "mt-4 text-center text-green-600 font-medium";

            // เรียกฟังก์ชันสร้างบัตร QR
            renderQRCards(students);
            
            // เปิดให้ปุ่มพิมพ์ทำงานได้
            btnPrint.disabled = false;
            
            // ซ่อนข้อความแจ้งเตือนหลังสร้างเสร็จ (หน่วงเวลา 2 วินาที)
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 2000);

        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Error Fetching Data:", error);
        statusMessage.innerText = "❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message;
        statusMessage.className = "mt-4 text-center text-red-500 font-medium";
    } finally {
        btnFetch.disabled = false;
    }
}

// ==========================================
// 3. ฟังก์ชันสร้างการ์ดและวาด QR Code
// ==========================================
function renderQRCards(studentsArray) {
    studentsArray.forEach(student => {
        // 1. สร้างกล่อง (Card) สำหรับนักเรียน 1 คน
        const card = document.createElement('div');
        card.className = "qr-card bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center text-center shadow-sm";
        
        // 2. สร้างโครงสร้าง HTML ภายใน Card
        card.innerHTML = `
            <div class="w-full bg-blue-50 text-blue-800 font-bold py-1 rounded-t-lg text-sm mb-3">
                ${student.department || '-'} (${student.level || '-'})
            </div>
            <div class="qr-code-box mb-3 p-1 border border-slate-100 rounded-lg bg-white"></div>
            <h2 class="text-lg font-bold text-slate-800 leading-tight">${student.student_id || 'ไม่มีรหัส'}</h2>
            <p class="text-sm text-slate-600 font-medium mt-1 line-clamp-1">${student.name || 'ไม่มีชื่อ'}</p>
            <p class="text-xs text-slate-400 mt-1">ห้อง ${student.room || '-'}</p>
        `;

        // 3. นำ Card ไปใส่ใน Container
        qrContainer.appendChild(card);

        // 4. วาด QR Code ลงในกล่อง .qr-code-box ที่เพิ่งสร้าง
        // ใช้รหัสนักเรียน (student_id) เป็นข้อความใน QR Code
        const qrBox = card.querySelector('.qr-code-box');
        new QRCode(qrBox, {
            text: student.student_id.toString(), // ข้อมูลที่จะฝังใน QR
            width: 128,  // ความกว้าง (พิกเซล)
            height: 128, // ความสูง (พิกเซล)
            colorDark : "#0f172a", // สีของ QR (slate-900)
            colorLight : "#ffffff", // สีพื้นหลัง
            correctLevel : QRCode.CorrectLevel.H // ระดับการแก้ไขข้อผิดพลาด (H = สูงสุด สแกนง่าย)
        });
    });
}

// ==========================================
// 4. ผูก Event กดปุ่ม
// ==========================================
btnFetch.addEventListener('click', fetchStudents);

btnPrint.addEventListener('click', () => {
    // สั่งพิมพ์หน้าเว็บ (สามารถเลือก Save as PDF ได้ในหน้าต่างพิมพ์ของ Chrome/Edge)
    window.print();
});