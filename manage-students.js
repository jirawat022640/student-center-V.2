const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";
let allStudents = [];
let isEditMode = false;

// โหลดข้อมูลตอนเปิดหน้าเว็บ
async function loadData() {
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getStudents' }) });
        const result = await response.json();
        if (result.status === 'success') {
            allStudents = result.data;
            renderTable(allStudents);
            updateRoomFilter();
        } else {
            document.getElementById('student-list-body').innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">เกิดข้อผิดพลาด: ${result.message}</td></tr>`;
        }
    } catch (error) {
        document.getElementById('student-list-body').innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</td></tr>`;
    }
}

// สร้างตาราง
function renderTable(data) {
    const tbody = document.getElementById('student-list-body');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-slate-500">ไม่พบข้อมูลนักเรียน</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(s => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
            <td class="px-6 py-4 font-medium text-slate-700">${s.student_id}</td>
            <td class="px-6 py-4 text-slate-600">${s.name}</td>
            <td class="px-6 py-4 text-slate-500 text-sm">${s.department} (${s.level})</td>
            <td class="px-6 py-4 text-slate-500">${s.room}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="editStudent('${s.student_id}')" class="text-blue-500 hover:text-blue-700 font-medium mx-2 transition">แก้ไข</button>
                <button onclick="deleteStudent('${s.student_id}')" class="text-red-500 hover:text-red-700 font-medium mx-2 transition">ลบ</button>
            </td>
        </tr>
    `).join('');
}

// สร้างตัวกรองห้องเรียน
function updateRoomFilter() {
    const filterSelect = document.getElementById('filter-room');
    const rooms = [...new Set(allStudents.map(s => s.room).filter(Boolean))].sort();
    filterSelect.innerHTML = '<option value="">ทุกห้องเรียน</option>';
    rooms.forEach(room => {
        filterSelect.innerHTML += `<option value="${room}">ห้อง ${room}</option>`;
    });
}

// ควบคุม Modal
function openModal() {
    isEditMode = false;
    document.getElementById('modal-title').innerText = "เพิ่มนักเรียน";
    document.getElementById('m-id').disabled = false;
    clearModal();
    document.getElementById('student-modal').classList.remove('hidden');
}

function closeModal() { 
    document.getElementById('student-modal').classList.add('hidden'); 
}

function clearModal() {
    ['m-id', 'm-name', 'm-level', 'm-room', 'm-dept'].forEach(id => document.getElementById(id).value = '');
}

// ระบบจัดการข้อมูล (CRUD)
function editStudent(id) {
    isEditMode = true;
    const s = allStudents.find(item => item.student_id.toString() === id.toString());
    document.getElementById('m-id').value = s.student_id;
    document.getElementById('m-id').disabled = true; // ห้ามแก้รหัสตอนแก้ไข
    document.getElementById('m-name').value = s.name;
    document.getElementById('m-level').value = s.level;
    document.getElementById('m-room').value = s.room;
    document.getElementById('m-dept').value = s.department;
    document.getElementById('modal-title').innerText = "แก้ไขข้อมูลนักเรียน";
    document.getElementById('student-modal').classList.remove('hidden');
}

async function saveStudent() {
    const btnSave = document.getElementById('btn-save-modal');
    btnSave.innerText = "กำลังบันทึก...";
    btnSave.disabled = true;

    const data = {
        student_id: document.getElementById('m-id').value,
        name: document.getElementById('m-name').value,
        level: document.getElementById('m-level').value,
        room: document.getElementById('m-room').value,
        department: document.getElementById('m-dept').value
    };
    
    // Validate
    if(!data.student_id || !data.name) {
        alert("กรุณากรอกรหัสนักเรียนและชื่อให้ครบถ้วน");
        btnSave.innerText = "บันทึกข้อมูล";
        btnSave.disabled = false;
        return;
    }

    const action = isEditMode ? 'updateStudent' : 'addStudent';
    
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: action, data: data }) });
        const res = await response.json();
        if(res.status === 'success') {
            alert(res.message);
            closeModal();
            loadData();
        } else {
            alert("เกิดข้อผิดพลาด: " + res.message);
        }
    } catch (error) {
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
        btnSave.innerText = "บันทึกข้อมูล";
        btnSave.disabled = false;
    }
}

async function deleteStudent(id) {
    if(!confirm("ยืนยันการลบนักเรียนรหัส " + id + " ใช่หรือไม่? (ข้อมูลคะแนนที่สแกนไปแล้วใน Sheet จะยังอยู่)")) return;
    
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteStudent', student_id: id }) });
        const res = await response.json();
        if(res.status === 'success') { 
            loadData(); 
        } else {
            alert("เกิดข้อผิดพลาด: " + res.message);
        }
    } catch (error) {
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
}

// ระบบอัปโหลดไฟล์ CSV
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const btn = document.getElementById('btn-upload');
    const spanText = btn.querySelector('span');
    const originalText = spanText.innerText;
    spanText.innerText = 'กำลังอ่านไฟล์...';
    btn.disabled = true;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const data = results.data;
            if (data.length === 0) {
                alert("ไฟล์ว่างเปล่าครับ");
                resetBtn();
                return;
            }

            // จัดฟอร์แมตข้อมูล (เช็กชื่อคอลัมน์จาก Excel ให้ตรงกับที่กำหนด)
            const formattedData = data.map(row => ({
                student_id: row['รหัสนักเรียน'] || row['student_id'] || '',
                name: row['ชื่อ-สกุล'] || row['name'] || '',
                level: row['ระดับชั้น'] || row['level'] || '',
                department: row['แผนก'] || row['department'] || '',
                room: row['ห้อง'] || row['room'] || ''
            })).filter(item => item.student_id !== '');

            if (formattedData.length === 0) {
                alert("รูปแบบไฟล์ไม่ถูกต้องครับ กรุณาตรวจสอบว่ามีคอลัมน์ชื่อ 'รหัสนักเรียน' และ 'ชื่อ-สกุล' หรือไม่");
                resetBtn();
                return;
            }

            spanText.innerText = 'กำลังอัปโหลดข้อมูล...';
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'bulkAddStudents', data: formattedData })
                });
                const res = await response.json();
                if (res.status === 'success') {
                    alert(res.message);
                    loadData();
                } else {
                    alert("เกิดข้อผิดพลาด: " + res.message);
                }
            } catch (error) {
                alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ครับ");
            } finally {
                resetBtn();
            }
        }
    });

    function resetBtn() {
        spanText.innerText = originalText;
        btn.disabled = false;
        event.target.value = ''; // เคลียร์ค่า input file
    }
}

// ระบบ Search และ กรอง
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('filter-room').addEventListener('change', applyFilters);

function applyFilters() {
    const searchVal = document.getElementById('search-input').value.toLowerCase();
    const roomVal = document.getElementById('filter-room').value;
    
    let filtered = allStudents;
    
    if (searchVal) {
        filtered = filtered.filter(s => s.name.toLowerCase().includes(searchVal) || s.student_id.toString().includes(searchVal));
    }
    
    if (roomVal) {
        filtered = filtered.filter(s => s.room === roomVal);
    }
    
    renderTable(filtered);
}

// โหลดข้อมูลเริ่มต้น
document.addEventListener("DOMContentLoaded", loadData);