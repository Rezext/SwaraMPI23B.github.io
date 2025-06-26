// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyBA0kQTRed4MuEjqojRjC3J2LiQPl6JNaY",
    authDomain: "swara-mpi-23b.firebaseapp.com",
    projectId: "swara-mpi-23b",
    storageBucket: "swara-mpi-23b.firebasestorage.app",
    messagingSenderId: "639234057858",
    appId: "1:639234057858:web:f7d33bed0b79f21796b69b"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Daftar NIM terdaftar
const rakyatNIMs = ['230101050102', '230101050110', '230101050111', '230101050112', '230101050113', '230101050114', '230101050115', '230101050273', '230101050274', '230101050275', '230101050276', '230101050277', '230101050651', '230101050652', '230101050665', '230101050666', '230101050667', '230101050669', '230101050670', '230101050672', '230101050674', '230101050675', '230101050676', '230101050678', '230101050679', '230101050680', '230101050681', '230101050683', '230101050764', '230101050765', '230101050766', '230101050768'];
const adminNIMs = ['230101050652', '230101050111', '230101050110'];

// --- FUNGSI NAVIGASI ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showRakyatLoginPage() { showPage('rakyat-login-page'); }
function showAdminLoginPage() { showPage('admin-login-page'); }

function logout() {
    document.getElementById('nim-rakyat').value = '';
    document.getElementById('nim-admin').value = '';
    showRakyatLoginPage();
}

// --- FUNGSI LOGIN ---
function handleRakyatLogin() {
    const nim = document.getElementById('nim-rakyat').value;
    if (rakyatNIMs.includes(nim)) {
        showPage('rakyat-view');
        showRakyatTab('keluhan');
    } else {
        alert('NIM tidak terdaftar. Silakan coba lagi.');
    }
}

function handleAdminLogin() {
    const nim = document.getElementById('nim-admin').value;
    if (adminNIMs.includes(nim)) {
        showPage('admin-view');
        showAdminTab('keluhan');
        setupRealtimeListeners();
    } else {
        alert('NIM Admin tidak valid.');
    }
}

// --- FUNGSI TAB ---
function showRakyatTab(tabName) {
    document.querySelectorAll('#rakyat-view .tab-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#rakyat-view button[onclick="showRakyatTab('${tabName}')"]`).classList.add('active');
    document.querySelectorAll('#rakyat-view .tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`rakyat-${tabName}-content`).classList.add('active');
}

document.querySelectorAll('.sub-tab-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const targetId = event.target.dataset.target;
        document.querySelectorAll('.sub-tab-button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    });
});

function showAdminTab(tabName) {
    document.querySelectorAll('#admin-view .tab-button').forEach(b => b.classList.remove('active'));
    document.querySelector(`#admin-view button[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.querySelectorAll('#admin-view .tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`admin-${tabName}-content`).classList.add('active');
}

// --- FUNGSI SUBMIT DATA ---
function submitToFirebase(collection, data, message) {
    const input = document.getElementById(data.inputId);
    if (input.value.trim() === '') {
        alert(`${message} tidak boleh kosong.`);
        return;
    }
    const payload = {
        text: input.value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ...data.extra
    };
    db.collection(collection).add(payload).then(() => {
        input.value = '';
        document.getElementById('terima-kasih-message').innerText = `Terima Kasih Sudah\nMenyampaikan ${message}-nya!`;
        showPage('terima-kasih-page');
        setTimeout(() => showPage('rakyat-view'), 2000);
    }).catch(error => {
        console.error("Error adding document: ", error);
        alert(`Gagal mengirim ${message}. Coba lagi.`);
    });
}

function submitKeluhan() {
    submitToFirebase('keluhan', { inputId: 'keluhan-input' }, 'Keluhan');
}

function submitIde() {
    submitToFirebase('ide', { inputId: 'ide-input' }, 'Ide dan Saran');
}

function submitConfess(type) {
    const inputId = (type === 'rahasia_banget') ? 'confess-banget-input' : 'confess-aja-input';
    submitToFirebase('confessions', { inputId: inputId, extra: { type: type } }, 'Confess');
}

// --- FITUR MELIHAT CONFESS PUBLIK ---
function showPublicConfessPage() {
    const listContainer = document.getElementById('public-confess-list');
    listContainer.innerHTML = '<p>Memuat confess...</p>';
    db.collection('confessions').where('type', '==', 'rahasia_aja').orderBy('timestamp', 'desc').get()
      .then(snapshot => {
        listContainer.innerHTML = '';
        if (snapshot.empty) {
            listContainer.innerHTML = '<p>Belum ada confess, jadilah yang pertama!</p>';
            return;
        }
        snapshot.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'confess-card';
            card.textContent = doc.data().text;
            listContainer.appendChild(card);
        });
      });
    showPage('public-confess-view');
}

// --- FUNGSI DASBOR ADMIN ---
function setupRealtimeListeners() {
    db.collection('keluhan').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('keluhan', snapshot.docs.map(doc => doc.data())));
    db.collection('ide').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('ide', snapshot.docs.map(doc => doc.data())));
    db.collection('confessions').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderAdminConfessions(snapshot.docs.map(doc => doc.data())));
}

function renderSubmissions(type, data) {
    const contentArea = document.getElementById(`admin-${type}-content`);
    renderGroupedByMonth(contentArea, data, type);
}

function renderAdminConfessions(data) {
    const contentArea = document.getElementById('admin-confess-content');
    contentArea.innerHTML = '';
    
    const bangetData = data.filter(item => item.type === 'rahasia_banget');
    const ajaData = data.filter(item => item.type === 'rahasia_aja');

    const bangetTitle = document.createElement('h3');
    bangetTitle.textContent = "Confess (Rahasia Banget)";
    bangetTitle.style.marginTop = "0";
    contentArea.appendChild(bangetTitle);
    renderGroupedByMonth(contentArea, bangetData, 'Confess');
    
    const ajaTitle = document.createElement('h3');
    ajaTitle.textContent = "Confess (Rahasia Aja)";
    contentArea.appendChild(ajaTitle);
    renderGroupedByMonth(contentArea, ajaData, 'Confess');
}

function renderGroupedByMonth(container, data, type) {
    container.innerHTML = ''; // Clear container before rendering
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (data.length === 0) {
        container.innerHTML = '<p>Belum ada masukan.</p>';
        return;
    }
    const groupedByMonth = data.reduce((acc, item) => {
        if (!item.timestamp) return acc;
        const date = item.timestamp.toDate();
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item.text);
        return acc;
    }, {});

    for (const monthKey in groupedByMonth) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-group';
        const monthTitle = document.createElement('h3');
        monthTitle.textContent = monthKey;
        monthDiv.appendChild(monthTitle);
        groupedByMonth[monthKey].forEach((text, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'submission-item';
            itemDiv.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}: ${text}`;
            monthDiv.appendChild(itemDiv);
        });
        container.appendChild(monthDiv);
    }
}
