// ----- KONFIGURASI DAN VARIABEL GLOBAL -----
const firebaseConfig = {
    apiKey: "AIzaSyBA0kQTRed4MuEjqojRjC3J2LiQPl6JNaY",
    authDomain: "swara-mpi-23b.firebaseapp.com",
    projectId: "swara-mpi-23b",
    storageBucket: "swara-mpi-23b.firebasestorage.app",
    messagingSenderId: "639234057858",
    appId: "1:639234057858:web:f7d33bed0b79f21796b69b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DATA UNTUK FITUR ASPIRASI (DARI FILE ASLI) ---
const rakyatNIMs = ['230101050102', '230101050110', '230101050111', '230101050112', '230101050113', '230101050114', '230101050115', '230101050273', '230101050274', '230101050275', '230101050276', '230101050277', '230101050651', '230101050652', '230101050665', '230101050666', '230101050667', '230101050669', '230101050670', '230101050672', '230101050674', '230101050675', '230101050676', '230101050678', '230101050679', '230101050680', '230101050681', '230101050683', '230101050764', '230101050765', '230101050766', '230101050768'];
const adminNIMs = ['230101050652', '230101050111', '230101050110', '230101050683'];
const aspirasiAdminPassword = "swara-2025";

// --- DATA BARU: FITUR PEMBAGIAN KELOMPOK ---
const groupAdminPassword = "MPI_2023";
const memberNames = ["Ridwan", "Novi", "Rania", "Ranty", "Rifatun", "Mardiah", "Rosidah", "Rizkya", "Khadizah", "Uswatun", "Shofia", "Aulia", "Qosyairi", "Rijani", "Diana", "Elya", "Evy", "Gitalis", "Dayah", "Husna", "Ismi", "Lutfiah", "Qurratulaini", "Baichaki", "Islami", "Luthfi", "Royyan", "Nadia", "Ghina", "Nisrin", "Casilda", "Mihbali"];
let manualGroupCount = 0;
let tempGeneratedProjectData = null; // (BARU) Untuk menyimpan hasil acak sementara

// --- DATA BARU: FITUR NOTIFIKASI ---
const classSchedule = {
    1: { day: 'Senin', courses: ['Manajemen Layanan Khusus', 'Metode Penelitian Kualitatif'] },
    2: { day: 'Selasa', courses: ['Metode Penelitian Kuantitatif', 'Manajemen Laboratorium Pendidikan'] },
    3: { day: 'Rabu', courses: ['Evaluasi Program Pendidikan', 'Manajemen Pendidikan dan Pelatihan', 'Supervisi Pendidikan II'] },
    4: { day: 'Kamis', courses: ['Marketing Pendidikan', 'Manajemen Kearsipan', 'Akreditasi Sekolah/Madrasah'] },
    5: { day: 'Jum\'at', courses: ['Event Manajemen'] },
    6: { day: 'Sabtu', courses: [] },
    0: { day: 'Minggu', courses: [] }
};
let notificationTimeoutId = null;

// ----- FUNGSI NAVIGASI UTAMA -----
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'group-division-page') {
        loadAllProjects();
    }
}

function showAspirasiSubPage(subPageId) {
    document.querySelectorAll('#aspirasi-container .sub-page').forEach(page => page.classList.remove('active'));
    document.getElementById(subPageId).classList.add('active');
}

// ----- BAGIAN 1: LOGIKA FITUR ASPIRASI & CONFESS (DARI FILE ASLI) -----
function handleRakyatLogin() {
    const nim = document.getElementById('nim-rakyat').value;
    if (rakyatNIMs.includes(nim)) {
        showAspirasiSubPage('rakyat-view');
        showRakyatTab('keluhan');
        checkAndRequestNotificationPermission();
    } else {
        alert('NIM tidak terdaftar. Silakan coba lagi.');
    }
}

function handleAdminLogin() {
    const nim = document.getElementById('nim-admin').value;
    const password = document.getElementById('password-admin').value;
    if (adminNIMs.includes(nim) && password === aspirasiAdminPassword) {
        showAspirasiSubPage('admin-view');
        showAdminTab('keluhan');
        setupRealtimeListeners();
        loadNotificationSetting();
    } else {
        alert('NIM atau Password Admin salah.');
    }
}

function logoutAspirasi() {
    document.getElementById('nim-rakyat').value = '';
    document.getElementById('nim-admin').value = '';
    document.getElementById('password-admin').value = '';
    showAspirasiSubPage('rakyat-login-page');
}

function showRakyatTab(tabName) {
    document.querySelectorAll('#rakyat-view .tab-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#rakyat-view button[onclick="showRakyatTab('${tabName}')"]`).classList.add('active');
    document.querySelectorAll('#rakyat-view .tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`rakyat-${tabName}-content`).classList.add('active');
}

document.querySelectorAll('.sub-tab-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const parent = event.target.closest('.tab-content');
        parent.querySelectorAll('.sub-tab-button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        parent.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
        parent.querySelector(`#${event.target.dataset.target}`).classList.add('active');
    });
});

function showAdminTab(tabName) {
    document.querySelectorAll('#admin-view .tab-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#admin-view button[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.querySelectorAll('#admin-view .tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`admin-${tabName}-content`).classList.add('active');
}

function submitToFirebase(collection, data, message) {
    const input = document.getElementById(data.inputId);
    if (input.value.trim() === '') {
        alert(`${message} tidak boleh kosong.`);
        return;
    }
    const payload = { text: input.value, timestamp: firebase.firestore.FieldValue.serverTimestamp(), ...data.extra };
    db.collection(collection).add(payload).then(() => {
        input.value = '';
        document.getElementById('terima-kasih-message').innerText = `Terima Kasih Sudah\nMenyampaikan ${message}-nya!`;
        showAspirasiSubPage('terima-kasih-page');
        setTimeout(() => showAspirasiSubPage('rakyat-view'), 2000);
    }).catch(error => {
        console.error("Error adding document: ", error);
        alert(`Gagal mengirim ${message}. Coba lagi.`);
    });
}

function submitKeluhan() { submitToFirebase('keluhan', { inputId: 'keluhan-input' }, 'Keluhan'); }
function submitIde() { submitToFirebase('ide', { inputId: 'ide-input' }, 'Ide dan Saran'); }
function submitConfess(type) {
    const inputId = (type === 'rahasia_banget') ? 'confess-banget-input' : 'confess-aja-input';
    submitToFirebase('confessions', { inputId: inputId, extra: { type: type } }, 'Confess');
}

function showPublicConfessPage() {
    const listContainer = document.getElementById('public-confess-list');
    listContainer.innerHTML = '<p>Memuat confess...</p>';
    db.collection('confessions').where('type', '==', 'rahasia_aja').orderBy('timestamp', 'desc').get()
      .then(snapshot => {
        listContainer.innerHTML = snapshot.empty ? '<p>Belum ada confess, jadilah yang pertama!</p>' : '';
        snapshot.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'confess-card';
            card.textContent = doc.data().text;
            listContainer.appendChild(card);
        });
      }).catch(error => {
          console.error("Gagal mengambil data confess publik:", error);
          listContainer.innerHTML = '<p>Gagal memuat confess. Silakan coba lagi nanti.</p>';
      });
    showAspirasiSubPage('public-confess-view');
}

function setupRealtimeListeners() {
    db.collection('keluhan').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('keluhan', snapshot.docs));
    db.collection('ide').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('ide', snapshot.docs));
    db.collection('confessions').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderAdminConfessions(snapshot.docs));
}

function renderSubmissions(type, docs) {
    const contentArea = document.getElementById(`admin-${type}-content`);
    contentArea.innerHTML = '';
    renderGroupedByMonth(contentArea, docs, false);
}

function renderAdminConfessions(docs) {
    const contentArea = document.getElementById('admin-confess-content');
    contentArea.innerHTML = '';
    const bangetDocs = docs.filter(doc => doc.data().type === 'rahasia_banget');
    const ajaDocs = docs.filter(doc => doc.data().type === 'rahasia_aja');
    contentArea.innerHTML += '<h3>Confess (Rahasia Banget)</h3>';
    renderGroupedByMonth(contentArea, bangetDocs, false);
    contentArea.innerHTML += '<h3>Confess (Rahasia Aja)</h3>';
    renderGroupedByMonth(contentArea, ajaDocs, true);
}

function renderGroupedByMonth(container, docs, showDeleteButton) {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (docs.length === 0) {
        container.innerHTML += '<p>Belum ada masukan.</p>';
        return;
    }
    const groupedByMonth = docs.reduce((acc, doc) => {
        const data = doc.data();
        if (!data.timestamp) return acc;
        const date = data.timestamp.toDate();
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push({ id: doc.id, ...data });
        return acc;
    }, {});
    for (const monthKey in groupedByMonth) {
        container.innerHTML += `<div class="month-group"><h4>${monthKey}</h4></div>`;
        const monthContainer = container.querySelector('.month-group:last-child');
        groupedByMonth[monthKey].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'submission-item';
            itemDiv.innerHTML = `<span class="submission-text">${item.text}</span>`;
            if (showDeleteButton) {
                itemDiv.innerHTML += `<button class="delete-button" onclick="deleteConfession('${item.id}')">Hapus</button>`;
            }
            monthContainer.appendChild(itemDiv);
        });
    }
}

function deleteConfession(docId) {
    if (confirm("Apakah Anda yakin ingin menghapus confess ini?")) {
        db.collection('confessions').doc(docId).delete().catch(error => console.error("Error removing document: ", error));
    }
}

// ----- BAGIAN 2: LOGIKA BARU FITUR PEMBAGIAN KELOMPOK -----
function showGroupTab(tabName) {
    document.querySelectorAll('.group-container .tab-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`.group-container .tab-button[onclick="showGroupTab('${tabName}')"]`).classList.add('active');
    document.querySelectorAll('.group-container .group-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`group-tab-${tabName}`).classList.add('active');
}

document.querySelectorAll('input[name="division-method"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const byGroupCountInput = document.getElementById('group-count');
        const byMemberCountInput = document.getElementById('member-count');
        if (e.target.value === 'by-group-count') {
            byGroupCountInput.disabled = false;
            byMemberCountInput.disabled = true;
            byMemberCountInput.value = '';
        } else {
            byGroupCountInput.disabled = true;
            byGroupCountInput.value = '';
            byMemberCountInput.disabled = false;
        }
    });
});

function validateGroupForm(isManual = false) {
    const suffix = isManual ? '-manual' : '';
    const pj = document.getElementById(`pj-name${suffix}`).value.trim();
    const course = document.getElementById(`course-name${suffix}`).value.trim();
    const lecturer = document.getElementById(`lecturer-name${suffix}`).value.trim();
    const password = document.getElementById(`group-password${suffix}`).value.trim();

    if (!pj || !course || !lecturer || !password) {
        alert("Semua field (Penanggung Jawab, Mata Kuliah, Dosen, Password) harus diisi!");
        return null;
    }
    if (password !== groupAdminPassword) {
        alert("Password Proyek salah!");
        return null;
    }
    return { pj, course, lecturer };
}

function generateGroups() {
    const formData = validateGroupForm();
    if (!formData) return;

    const resultContainer = document.getElementById('random-result-container');
    resultContainer.innerHTML = '';
    document.getElementById('save-random-result-area').style.display = 'none';
    tempGeneratedProjectData = null;

    const shuffledNames = [...memberNames].sort(() => 0.5 - Math.random());
    const method = document.querySelector('input[name="division-method"]:checked').value;
    let groups = [];
    if (method === 'by-group-count') {
        const groupCount = parseInt(document.getElementById('group-count').value);
        if (!groupCount || groupCount <= 0) { alert("Jumlah kelompok tidak valid."); return; }
        groups = Array.from({ length: groupCount }, () => []);
        shuffledNames.forEach((name, index) => groups[index % groupCount].push(name));
    } else {
        const memberCount = parseInt(document.getElementById('member-count').value);
        if (!memberCount || memberCount <= 0) { alert("Jumlah anggota per kelompok tidak valid."); return; }
        for (let i = 0; i < shuffledNames.length; i += memberCount) {
            groups.push(shuffledNames.slice(i, i + memberCount));
        }
    }
    
    const groupObjects = groups.map((members, index) => ({ name: `Kelompok ${index + 1}`, members }));
    resultContainer.innerHTML = groupObjects.map(g => `<div class="group-card"><h4>${g.name}</h4><ul>${g.members.map(m => `<li>${m}</li>`).join('')}</ul></div>`).join('');
    
    tempGeneratedProjectData = { ...formData, groups: groupObjects, isReleased: false };
    document.getElementById('save-random-result-area').style.display = 'block';
}

async function saveGeneratedGroups() {
    if (!tempGeneratedProjectData) {
        alert("Tidak ada data kelompok untuk disimpan. Silakan generate terlebih dahulu.");
        return;
    }
    await saveProjectToFirebase(tempGeneratedProjectData);
    document.getElementById('save-random-result-area').style.display = 'none';
    document.getElementById('random-result-container').innerHTML = '<p style="color: green; margin-top: 1rem;">Hasil berhasil disimpan!</p>';
    tempGeneratedProjectData = null;
}

function addManualGroupSlot() {
    manualGroupCount++;
    const area = document.getElementById('manual-group-input-area');
    const slot = document.createElement('div');
    slot.className = 'manual-group-slot';
    slot.innerHTML = `<h4>Kelompok ${manualGroupCount}</h4><textarea placeholder="Masukkan nama anggota, pisahkan dengan koma (,) atau baris baru"></textarea>`;
    area.appendChild(slot);
}

function saveManualGroups() {
    const formData = validateGroupForm(true);
    if (!formData) return;
    const groups = [];
    document.querySelectorAll('#manual-group-input-area .manual-group-slot').forEach((slot, i) => {
        const members = slot.querySelector('textarea').value.split(/[\n,]+/).map(name => name.trim()).filter(Boolean);
        if (members.length > 0) {
            groups.push({ name: `Kelompok ${i + 1}`, members });
        }
    });
    if (groups.length === 0) { alert("Tidak ada kelompok yang diisi."); return; }
    const projectData = { ...formData, groups: groups, isReleased: false };
    saveProjectToFirebase(projectData);
}

async function saveProjectToFirebase(projectData) {
    try {
        const dataToSave = { ...projectData, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
        await db.collection('group_projects').add(dataToSave);
        alert(`Proyek kelompok untuk "${projectData.course}" berhasil disimpan! Rilis di tab "Detail Kelompok".`);
    } catch (error) { 
        console.error("Error saving project: ", error);
        alert("Gagal menyimpan proyek. Lihat konsol untuk detail.");
    }
}

async function loadAllProjects() {
    const container = document.getElementById('all-projects-container');
    container.innerHTML = "<p>Memuat proyek...</p>";
    try {
        const snapshot = await db.collection('group_projects').orderBy('timestamp', 'desc').get();
        container.innerHTML = snapshot.empty ? "<p>Belum ada proyek kelompok.</p>" : "";
        snapshot.forEach(doc => {
            const project = doc.data();
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `<h3>${project.course}</h3>
                <p class="details">Dosen: ${project.lecturer} | PJ: ${project.pj}</p>
                <p class="details">Status: <strong>${project.isReleased ? 'Sudah Dirilis' : 'Draft'}</strong></p>
                <div class="group-details">${project.isReleased ? project.groups.map(g => `<h4>${g.name}</h4><ul>${g.members.map(m => `<li>${m}</li>`).join('')}</ul>`).join('') : '<p><i>Hasil belum dirilis.</i></p>'}</div>
                <div class="actions">
                    <button class="release-btn" onclick="toggleRelease('${doc.id}', ${project.isReleased})">${project.isReleased ? 'Batal Rilis' : 'Rilis Hasil'}</button>
                    <button class="delete-btn" onclick="deleteProject('${doc.id}')">Hapus</button>
                </div>`;
            container.appendChild(card);
        });
    } catch (error) { console.error("Error loading projects: ", error); }
}

async function toggleRelease(docId, currentState) {
    const password = prompt("Masukkan Password Proyek (MPI_2023):");
    if (password === groupAdminPassword) {
        await db.collection('group_projects').doc(docId).update({ isReleased: !currentState });
        loadAllProjects();
    } else if (password) { alert("Password salah!"); }
}

async function deleteProject(docId) {
    const password = prompt("Masukkan Password Proyek (MPI_2023) untuk menghapus:");
    if (password === groupAdminPassword) {
        if (confirm("YAKIN ingin menghapus proyek ini permanen?")) {
            await db.collection('group_projects').doc(docId).delete();
            loadAllProjects();
        }
    } else if (password) { alert("Password salah!"); }
}

// ----- BAGIAN 3: LOGIKA BARU FITUR NOTIFIKASI JADWAL -----
async function checkAndRequestNotificationPermission() {
    if (!("Notification" in window)) return console.log("Browser tidak mendukung notifikasi.");
    if (Notification.permission === 'default') {
        if (await Notification.requestPermission() === 'granted') initializeNotificationScheduler();
    } else if (Notification.permission === 'granted') initializeNotificationScheduler();
}

async function initializeNotificationScheduler() {
    if (Notification.permission !== 'granted') return;
    if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
    try {
        const doc = await db.collection('settings').doc('notifications').get();
        if (doc.exists && doc.data().isEnabled) scheduleNextNotification();
        else console.log('Notifikasi tidak aktif di server.');
    } catch (error) { console.error("Gagal mengambil status notifikasi:", error); }
}

function scheduleNextNotification() {
    const now = new Date();
    const nowWITA = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
    let nextNotificationTime = new Date(nowWITA);
    nextNotificationTime.setHours(21, 0, 0, 0);
    if (nowWITA >= nextNotificationTime) nextNotificationTime.setDate(nextNotificationTime.getDate() + 1);
    const delay = nextNotificationTime.getTime() - nowWITA.getTime();
    console.log(`Notifikasi berikutnya dalam ${Math.round(delay / 60000)} menit.`);
    notificationTimeoutId = setTimeout(() => {
        sendScheduledNotification();
        scheduleNextNotification();
    }, delay);
}

function sendScheduledNotification() {
    const tomorrowDayIndex = (new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' })).getDay() + 1) % 7;
    const scheduleForTomorrow = classSchedule[tomorrowDayIndex];
    if (scheduleForTomorrow && scheduleForTomorrow.courses.length > 0) {
        new Notification(`Jadwal Kuliah Besok (${scheduleForTomorrow.day})`, {
            body: 'Matkul: ' + scheduleForTomorrow.courses.join(', '),
            icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
        });
    }
}

async function handleNotificationToggle(isEnabled) {
    try {
        await db.collection('settings').doc('notifications').set({ isEnabled: isEnabled });
        alert(`Notifikasi jadwal telah di-${isEnabled ? 'AKTIFKAN' : 'NONAKTIFKAN'}.`);
        if (isEnabled) initializeNotificationScheduler();
        else if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
    } catch (error) { console.error("Gagal mengubah status notifikasi:", error); }
}

async function loadNotificationSetting() {
    try {
        const doc = await db.collection('settings').doc('notifications').get();
        document.getElementById('notification-toggle').checked = doc.exists ? doc.data().isEnabled : false;
    } catch (error) { console.error("Gagal memuat pengaturan notifikasi:", error); }
}

// ----- INISIALISASI HALAMAN -----
document.addEventListener('DOMContentLoaded', () => {
    showPage('landing-page');
    addManualGroupSlot();
});
