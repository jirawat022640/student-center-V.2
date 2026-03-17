const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

const subjectSelect = document.getElementById('report-subject');
const roomSelect = document.getElementById('report-room');
const btnGenerate = document.getElementById('btn-generate');
const statusText = document.getElementById('report-status');
const reportContainer = document.getElementById('report-container');
const reportTitle = document.getElementById('report-title');
const reportBody = document.getElementById('report-body');
const btnExport = document.getElementById('btn-export');

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // โหลดข้อมูลวิชา
        const subRes = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getSubjects' }) });
        const subData = await subRes.json();
        if (subData.status === 'success') {
            subjectSelect.innerHTML = '<option value="">-- เลือกวิชา --</option>';
            subData.data.forEach(s => subjectSelect.innerHTML += `<option value="${s.subject_id}">${s.subject_id} (${s.subject_name})</option>`);
        }

        // โหลดข้อมูลนักเรียนเพื่อดึงห้องเรียนที่ไม่ซ้ำกัน
        const stdRes = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getStudents' }) });
        const stdData = await stdRes.json();
        if (stdData.status === 'success') {
            const rooms = [...new Set(stdData.data.map(s => s.room).filter(Boolean))].sort();
            roomSelect.innerHTML = '<option value="all">รวมนักเรียนทุกห้อง</option>';
            rooms.forEach(r => roomSelect.innerHTML += `<option value="${r}">ห้อง ${r}</option>`);
        }
    } catch (e) {
        subjectSelect.innerHTML = '<option value="">โหลดข้อมูลล้มเหลว</option>';
        roomSelect.innerHTML = '<option value="">โหลดข้อมูลล้มเหลว</option>';
    }
});

btnGenerate.addEventListener('click', async () => {
    const subjectId = subjectSelect.value;
    const room = roomSelect.value;

    if (!subjectId) {
        alert("กรุณาเลือกวิชาก่อนทำการดึงข้อมูลรายงานครับ");
        return;
    }

    reportContainer.classList.add('hidden');
    statusText.innerText = "กำลังคำนวณคะแนนและตัดเกรด กรุณารอสักครู่...";
    statusText.classList.remove('hidden');
    btnGenerate.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getGradeSummary', room: room, subject_id: subjectId })
        });
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            
            if (data.length === 0) {
                statusText.innerText = "❌ ไม่พบข้อมูลนักเรียนในห้องที่เลือก";
                return;
            }

            // แสดงหัวข้อรายงาน
            const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
            const roomName = room === "all" ? "ทุกห้องเรียน" : `ห้อง ${room}`;
            reportTitle.innerText = `สรุปผลการเรียน: ${subjectName} | ${roomName}`;

            // สร้างตาราง
            reportBody.innerHTML = data.map((student, index) => {
                const gradeColor = Number(student.grade) >= 2 ? "text-emerald-600" : "text-rose-600";
                return `
                <tr class="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition">
                    <td class="px-6 py-4 text-center text-slate-500">${index + 1}</td>
                    <td class="px-6 py-4 font-bold text-slate-800">${student.id}</td>
                    <td class="px-6 py-4 text-slate-700">${student.name}</td>
                    <td class="px-6 py-4 text-slate-500 text-sm">${student.department} (${student.room})</td>
                    <td class="px-6 py-4 text-center font-bold text-blue-600">${student.total} <span class="text-xs text-slate-400 font-normal">/ ${student.max_total}</span></td>
                    <td class="px-6 py-4 text-center font-extrabold text-xl ${gradeColor}">${student.grade}</td>
                </tr>
                `;
            }).join('');

            statusText.classList.add('hidden');
            reportContainer.classList.remove('hidden');
        } else {
            statusText.innerText = "❌ เกิดข้อผิดพลาด: " + result.message;
        }
    } catch (error) {
        statusText.innerText = "❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
    } finally {
        btnGenerate.disabled = false;
    }
});

// ฟังก์ชันส่งออกตารางเป็นไฟล์ Excel (SheetJS)
btnExport.addEventListener('click', () => {
    const table = document.getElementById("grade-table");
    
    // แปลงตาราง HTML เป็นสมุดงาน Excel (Workbook)
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Grade Report" });
    
    // ตั้งชื่อไฟล์ (เอาวันที่ปัจจุบันมาต่อท้าย)
    const subjectName = subjectSelect.value;
    const roomName = roomSelect.value === "all" ? "All" : roomSelect.value.replace('/', '-');
    const fileName = `Grade_Report_${subjectName}_Room_${roomName}.xlsx`;
    
    // สั่งดาวน์โหลดไฟล์
    XLSX.writeFile(workbook, fileName);
});