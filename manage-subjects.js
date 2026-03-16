const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

const tBody = document.getElementById('subject-list-body');
const btnAdd = document.getElementById('btn-add-subject');
const inputId = document.getElementById('sub-id');
const inputName = document.getElementById('sub-name');

// 1. โหลดข้อมูลวิชาทั้งหมด
async function loadSubjects() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getSubjects' })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            renderTable(result.data);
        } else {
            tBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">Error: ${result.message}</td></tr>`;
        }
    } catch (error) {
        tBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</td></tr>`;
    }
}

// 2. แสดงตาราง
function renderTable(data) {
    if (data.length === 0) {
        tBody.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-500 bg-slate-50 rounded-xl m-4 border-2 border-dashed border-slate-200 block">ยังไม่มีข้อมูลรายวิชาในระบบ</td></tr>';
        return;
    }
    
    tBody.innerHTML = data.map(sub => `
        <tr class="hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-bold text-blue-600">${sub.subject_id}</td>
            <td class="px-6 py-4 text-slate-700 font-medium">${sub.subject_name}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteSubject('${sub.subject_id}')" class="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-sm font-semibold transition">
                    ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

// 3. เพิ่มรายวิชา
btnAdd.addEventListener('click', async () => {
    const sId = inputId.value.trim();
    const sName = inputName.value.trim();

    if (!sId || !sName) {
        alert("กรุณากรอกรหัสวิชาและชื่อวิชาให้ครบถ้วนครับ");
        return;
    }

    btnAdd.innerText = "กำลังบันทึก...";
    btnAdd.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addSubject',
                data: { subject_id: sId, subject_name: sName }
            })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            inputId.value = '';
            inputName.value = '';
            loadSubjects(); // โหลดตารางใหม่
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
        btnAdd.innerText = "บันทึกวิชาเรียน";
        btnAdd.disabled = false;
    }
});

// 4. ลบรายวิชา
async function deleteSubject(subjectId) {
    if (!confirm(`ยืนยันการลบวิชา "${subjectId}" ใช่หรือไม่?`)) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteSubject', subject_id: subjectId })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            loadSubjects();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
}

// เริ่มทำงานเมื่อเปิดหน้าเว็บ
document.addEventListener("DOMContentLoaded", loadSubjects);