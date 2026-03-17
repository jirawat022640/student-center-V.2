// วาง URL ของ Web App Google Apps Script ที่นี่
const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

const subjectSelect = document.getElementById('student-subject-select');
const btnSearch = document.getElementById('btn-search');
const inputId = document.getElementById('student-id-input');
const errorText = document.getElementById('search-error');
const resultSection = document.getElementById('result-section');

// Elements สำหรับแสดงผล
const rSubjectLabel = document.getElementById('r-subject-label');
const rName = document.getElementById('r-name');
const rInfo = document.getElementById('r-info');
const rScore = document.getElementById('r-score');
const rMax = document.getElementById('r-max');
const rGrade = document.getElementById('r-grade');
const assignList = document.getElementById('assignment-list');
const taskCount = document.getElementById('task-count');

// โหลดข้อมูลวิชาทันทีที่เปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getSubjects' }) });
        const result = await response.json();
        if (result.status === 'success') {
            subjectSelect.innerHTML = '<option value="">-- เลือกวิชาที่ต้องการตรวจสอบ --</option>';
            result.data.forEach(sub => {
                subjectSelect.innerHTML += `<option value="${sub.subject_id}">${sub.subject_id} - ${sub.subject_name}</option>`;
            });
        }
    } catch (e) {
        subjectSelect.innerHTML = '<option value="">เกิดข้อผิดพลาดในการโหลดวิชา</option>';
    }
});

async function checkGrade() {
    const studentId = inputId.value.trim();
    const subjectId = subjectSelect.value;

    if (!subjectId) {
        errorText.innerText = "กรุณาเลือกวิชาเรียนก่อนครับ";
        errorText.classList.remove('hidden');
        return;
    }

    if (!studentId) {
        errorText.innerText = "กรุณากรอกรหัสประจำตัวนักเรียนให้ครบถ้วนครับ";
        errorText.classList.remove('hidden');
        return;
    }

    // กำลังโหลด
    errorText.classList.add('hidden');
    resultSection.classList.add('hidden');
    btnSearch.innerText = "กำลังค้นหา...";
    btnSearch.disabled = true;

    try {
        // ส่งทั้งรหัสนักเรียนและรหัสวิชาไปหา API
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'getStudentScores', 
                student_id: studentId,
                subject_id: subjectId
            })
        });
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            
            // ข้อมูลส่วนตัว
            rSubjectLabel.innerText = subjectSelect.options[subjectSelect.selectedIndex].text;
            rName.innerText = data.student.name;
            rInfo.innerText = `รหัส: ${data.student.student_id} | แผนก: ${data.student.department} (${data.student.level}) | ห้อง: ${data.student.room}`;
            
            // สรุปคะแนน
            rScore.innerText = data.total_score;
            rMax.innerText = data.max_total;
            rGrade.innerText = data.grade;

            // เปลี่ยนสีเกรด (เขียวถ้าผ่าน, แดงถ้าตก)
            rGrade.className = "text-5xl font-extrabold drop-shadow-md " + (Number(data.grade) >= 2 ? "text-emerald-400" : "text-rose-400");

            // อัปเดตจำนวนชิ้นงาน
            taskCount.innerText = `${data.assignments.length} ชิ้น`;

            // รายการชิ้นงานของวิชานี้
            if(data.assignments.length === 0) {
                assignList.innerHTML = '<li class="text-center text-slate-500 py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">ยังไม่มีการสั่งงานในวิชานี้</li>';
            } else {
                assignList.innerHTML = data.assignments.map(a => {
                    const isSubmitted = a.status === "ส่งแล้ว";
                    const statusColor = isSubmitted ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-rose-700 bg-rose-100 border-rose-200";
                    const statusIcon = isSubmitted 
                        ? `<svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
                        : `<svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

                    return `
                    <li class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:shadow-md hover:bg-white transition-all bg-slate-50/50">
                        <div class="mb-3 sm:mb-0 w-full sm:w-auto">
                            <p class="font-bold text-slate-800 text-lg">${a.name}</p>
                            <div class="flex flex-wrap items-center gap-2 mt-1.5 text-sm font-medium ${isSubmitted ? 'text-slate-600' : 'text-rose-500'}">
                                <span class="flex items-center gap-1">${statusIcon} ${a.status}</span>
                                <span class="text-slate-300">|</span>
                                <span class="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">รหัสงาน: ${a.assignment_id}</span>
                                ${isSubmitted ? `<span class="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> ${a.timestamp.split(' ')[0]}</span>` : ''}
                            </div>
                        </div>
                        <div class="text-right w-full sm:w-auto mt-2 sm:mt-0">
                            <span class="inline-flex items-center justify-center min-w-[5rem] px-4 py-2 rounded-xl border ${statusColor} text-lg font-extrabold shadow-sm">
                                ${a.score} / ${a.max_score}
                            </span>
                        </div>
                    </li>
                    `;
                }).join('');
            }

            // แสดงกล่องผลลัพธ์
            resultSection.classList.remove('hidden');
        } else {
            errorText.innerText = result.message;
            errorText.classList.remove('hidden');
        }
    } catch (error) {
        errorText.innerText = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ลองใหม่อีกครั้งครับ";
        errorText.classList.remove('hidden');
    } finally {
        // คืนค่าปุ่ม
        btnSearch.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> ตรวจสอบ`;
        btnSearch.disabled = false;
    }
}

btnSearch.addEventListener('click', checkGrade);
inputId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkGrade();
});