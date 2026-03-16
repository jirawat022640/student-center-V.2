const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

const tBody = document.getElementById('assign-list-body');
const subjectSelect = document.getElementById('assign-subject');
const btnAdd = document.getElementById('btn-add-assign');

const inputId = document.getElementById('assign-id');
const inputName = document.getElementById('assign-name');
const inputScore = document.getElementById('assign-score');

// โหลดข้อมูลวิชามาใส่ใน Dropdown
async function loadSubjects() {
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getSubjects' }) });
        const result = await response.json();
        
        if (result.status === 'success') {
            subjectSelect.innerHTML = '<option value="">-- เลือกวิชา --</option>';
            result.data.forEach(sub => {
                subjectSelect.innerHTML += `<option value="${sub.subject_id}">${sub.subject_id} (${sub.subject_name})</option>`;
            });
        }
    } catch (e) {
        subjectSelect.innerHTML = '<option value="">โหลดวิชาล้มเหลว</option>';
    }
}

// โหลดข้อมูลชิ้นงาน
async function loadAssignments() {
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getAssignments' }) });
        const result = await response.json();
        
        if (result.status === 'success') {
            renderTable(result.data);
        } else {
            tBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error: ${result.message}</td></tr>`;
        }
    } catch (error) {
        tBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</td></tr>`;
    }
}

function renderTable(data) {
    if (data.length === 0) {
        tBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500 bg-slate-50 rounded-xl m-4 border-2 border-dashed border-slate-200 block">ยังไม่มีชิ้นงานในระบบ</td></tr>';
        return;
    }
    
    tBody.innerHTML = data.map(item => `
        <tr class="hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-bold text-fuchsia-600">${item.assignment_id}</td>
            <td class="px-6 py-4 text-slate-500 text-sm">${item.subject_id}</td>
            <td class="px-6 py-4 text-slate-800 font-medium">${item.assignment_name}</td>
            <td class="px-6 py-4 text-center font-bold text-slate-700">${item.max_score}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteAssignment('${item.assignment_id}')" class="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-sm font-semibold transition">
                    ลบ
                </button>
            </td>
        </tr>
    `).join('');
}

// เพิ่มชิ้นงาน
btnAdd.addEventListener('click', async () => {
    const data = {
        assignment_id: inputId.value.trim(),
        subject_id: subjectSelect.value,
        assignment_name: inputName.value.trim(),
        max_score: inputScore.value.trim()
    };

    if (!data.assignment_id || !data.subject_id || !data.assignment_name || !data.max_score) {
        alert("กรุณากรอกข้อมูลให้ครบทุกช่องครับ");
        return;
    }

    btnAdd.innerText = "กำลังบันทึก...";
    btnAdd.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addAssignment', data: data })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            inputId.value = '';
            inputName.value = '';
            inputScore.value = '';
            loadAssignments();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
        btnAdd.innerText = "บันทึกชิ้นงาน";
        btnAdd.disabled = false;
    }
});

// ลบชิ้นงาน
async function deleteAssignment(assignmentId) {
    if (!confirm(`ยืนยันการลบชิ้นงาน "${assignmentId}" ใช่หรือไม่?`)) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteAssignment', assignment_id: assignmentId })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            loadAssignments();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadSubjects();
    loadAssignments();
});