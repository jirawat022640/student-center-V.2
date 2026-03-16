const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

let allStudents = [];
const roomSelect = document.getElementById('grade-room-select');
const assignInput = document.getElementById('assign-id');
const tableBody = document.getElementById('student-table-body');
const btnSaveAll = document.getElementById('btn-save-all');
const statusText = document.getElementById('grade-status');

// 1. โหลดข้อมูลนักเรียนทั้งหมดเมื่อเปิดหน้าเว็บ
async function loadStudentsForGrading() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudents' })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            allStudents = result.data;
            const rooms = [...new Set(allStudents.map(s => s.room).filter(Boolean))].sort();
            roomSelect.innerHTML = '<option value="">-- เลือกห้องเรียน --</option>';
            rooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${room}">ห้อง ${room}</option>`;
            });
        }
    } catch (error) {
        statusText.innerText = "❌ เกิดข้อผิดพลาดในการโหลดข้อมูล";
        statusText.className = "w-full text-sm font-medium text-red-600 py-2";
    }
}

// 2. แสดงตารางนักเรียนตามห้องที่เลือก
roomSelect.addEventListener('change', () => {
    const selectedRoom = roomSelect.value;
    if (!selectedRoom) {
        tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-slate-500">กรุณาเลือกห้องเรียนเพื่อแสดงรายชื่อ</td></tr>';
        return;
    }

    const roomStudents = allStudents.filter(s => s.room === selectedRoom);
    tableBody.innerHTML = ''; // เคลียร์ตารางเดิม

    roomStudents.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${index + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 student-id-cell">${student.student_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${student.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${student.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <input type="number" class="score-input w-24 px-3 py-1.5 border border-slate-300 rounded text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="0">
            </td>
        `;
        tableBody.appendChild(tr);
    });
});

// 3. บันทึกข้อมูลคะแนนทั้งห้องส่งไป API
btnSaveAll.addEventListener('click', async () => {
    const assignmentId = assignInput.value.trim();
    if (!assignmentId) {
        alert("กรุณากรอกรหัสงาน (Assignment ID) ก่อนบันทึกครับ");
        return;
    }

    // รวบรวมข้อมูลคะแนนจากในตาราง
    const rows = tableBody.querySelectorAll('tr');
    let scoresData = [];

    rows.forEach(row => {
        const studentIdElem = row.querySelector('.student-id-cell');
        const scoreInputElem = row.querySelector('.score-input');
        
        if (studentIdElem && scoreInputElem) {
            const scoreVal = scoreInputElem.value.trim();
            // เก็บเฉพาะคนที่มีการกรอกคะแนน
            if (scoreVal !== "") {
                scoresData.push({
                    student_id: studentIdElem.innerText,
                    score: scoreVal
                });
            }
        }
    });

    if (scoresData.length === 0) {
        alert("ยังไม่มีการกรอกคะแนนเลยครับ");
        return;
    }

    // เตรียมส่งข้อมูล
    statusText.innerText = "กำลังบันทึกข้อมูล...";
    statusText.className = "w-full text-sm font-medium text-blue-600 py-2 animate-pulse";
    btnSaveAll.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'bulkRecordScore',
                assignment_id: assignmentId,
                scores: scoresData
            })
        });

        const result = await response.json();
        if (result.status === 'success') {
            statusText.innerText = "✅ " + result.message;
            statusText.className = "w-full text-sm font-medium text-green-600 py-2";
            
            // ล้างช่องกรอกคะแนน
            document.querySelectorAll('.score-input').forEach(input => input.value = "");
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error(error);
        statusText.innerText = "❌ เกิดข้อผิดพลาด: " + error.message;
        statusText.className = "w-full text-sm font-medium text-red-600 py-2";
    } finally {
        btnSaveAll.disabled = false;
    }
});

// โหลดข้อมูลเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", loadStudentsForGrading);