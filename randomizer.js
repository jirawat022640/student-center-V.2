const API_URL = "https://script.google.com/macros/s/AKfycbxbEwGdAbrcXmtlKKZQ19iZ5i5izSHMKEi5b1ZCTKfI2xT24Ng3oXSpEZU2sGmiCvHYHA/exec";

let allStudents = [];
const roomSelect = document.getElementById('room-select');
const randomName = document.getElementById('random-name');
const randomId = document.getElementById('random-id');
const btnRandom = document.getElementById('btn-random');
const spinSound = document.getElementById('spin-sound');

async function loadStudents() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'getStudents' })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            allStudents = result.data;
            // ดึงรายชื่อห้องที่ไม่ซ้ำกันออกมาใส่ Dropdown
            const rooms = [...new Set(allStudents.map(s => s.room).filter(Boolean))].sort();
            roomSelect.innerHTML = '<option value="all">รวมทุกห้อง</option>';
            rooms.forEach(room => {
                roomSelect.innerHTML += `<option value="${room}">ห้อง ${room}</option>`;
            });
        }
    } catch (error) {
        console.error("Error loading students:", error);
        roomSelect.innerHTML = '<option value="">โหลดข้อมูลล้มเหลว</option>';
    }
}

function startRandomizer() {
    let currentRoom = roomSelect.value;
    let pool = allStudents;
    
    if (currentRoom !== "all") {
        pool = allStudents.filter(s => s.room === currentRoom);
    }

    if (pool.length === 0) {
        alert("ไม่พบนักเรียนในห้องที่เลือกครับ!");
        return;
    }

    btnRandom.disabled = true;
    let counter = 0;
    const maxSpins = 30; // จำนวนรอบที่กระพริบ
    const speed = 50; // ความเร็ว

    // สุ่มกระพริบชื่อไปเรื่อยๆ
    const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * pool.length);
        randomName.innerText = pool[randomIndex].name;
        randomId.innerText = pool[randomIndex].student_id;
        counter++;

        if (counter >= maxSpins) {
            clearInterval(interval);
            // เมื่อหยุด ให้ผู้โชคดีคนสุดท้าย
            const winner = pool[Math.floor(Math.random() * pool.length)];
            randomName.innerText = winner.name;
            randomId.innerText = winner.student_id;
            
            // เล่นเสียงและจุดพลุ
            spinSound.play();
            fireConfetti();
            btnRandom.disabled = false;
        }
    }, speed);
}

function fireConfetti() {
    var duration = 3 * 1000;
    var end = Date.now() + duration;

    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

document.addEventListener("DOMContentLoaded", loadStudents);
btnRandom.addEventListener('click', startRandomizer);