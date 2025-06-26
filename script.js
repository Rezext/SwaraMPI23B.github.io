// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBA0kQTRed4MuEjqojRjC3J2LiQPl6JNaY",
  authDomain: "swara-mpi-23b.firebaseapp.com",
  projectId: "swara-mpi-23b",
  storageBucket: "swara-mpi-23b.firebasestorage.app",
  messagingSenderId: "639234057858",
  appId: "1:639234057858:web:f7d33bed0b79f21796b69b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- INISIALISASI FIREBASE ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DAFTAR NIM TERDAFTAR (TIDAK BERUBAH) ---
const rakyatNIMs = ['230101050102', '230101050110', '230101050111', '230101050112', '230101050113', '230101050114', '230101050115', '230101050273', '230101050274', '230101050275', '230101050276', '230101050277', '230101050651', '230101050652', '230101050665', '230101050666', '230101050667', '230101050669', '230101050670', '230101050672', '230101050674', '230101050675', '230101050676', '230101050678', '230101050679', '230101050680', '230101050681', '230101050683', '230101050764', '230101050765', '230101050766', '230101050768'];
const adminNIMs = ['230101050652', '230101050111', '230101050110'];

// --- FUNGSI NAVIGASI HALAMAN ---
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
        showRakyatTab('keluhan'); // Default ke tab keluhan
    } else {
        alert('NIM tidak terdaftar. Silakan coba lagi.');
    }
}
function handleAdminLogin() {
    const nim = document.getElementById('nim-admin').value;
    if (adminNIMs.includes(nim)) {
        showPage('admin-view');
        showAdminTab('keluhan'); // Default ke tab keluhan
        setupRealtimeListeners();
    } else {
        alert('NIM Admin tidak valid.');
    }
}

// --- FUNGSI TAB ---
function showRakyatTab(tabName) {
    document.querySelectorAll('#rakyat-view .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#rakyat-view .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`rakyat-${tabName}-content`).classList.add('active');
    document.getElementById(`tab-${tabName}-rakyat`).classList.add('active');
}
function showAdminTab(tabName) {
    document.querySelectorAll('#admin-view .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#admin-view .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`admin-${tabName}-content`).classList.add('active');
    document.getElementById(`tab-${tabName}-admin`).classList.add('active');
}

// --- FUNGSI SUBMIT ---
function submitKeluhan() {
    const input = document.getElementById('keluhan-input');
    if (input.value.trim() === '') { alert('Keluhan tidak boleh kosong.'); return; }
    db.collection('keluhan').add({ text: input.value, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        input.value = '';
        showPage('terima-kasih-keluhan');
        setTimeout(logout, 2000);
      });
}
function submitIde() {
    const input = document.getElementById('ide-input');
    if (input.value.trim() === '') { alert('Ide dan Saran tidak boleh kosong.'); return; }
    db.collection('ide').add({ text: input.value, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        input.value = '';
        showPage('terima-kasih-ide');
        setTimeout(logout, 2000);
      });
}

// --- (BARU) FUNGSI FITUR CONFESS ---
function showConfessSubTab(subTabName) {
    document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sub-tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`confess-${subTabName}`).classList.add('active');
    event.target.classList.add('active');
}

function submitConfess(type) {
    const inputId = (type === 'rahasia_banget') ? 'confess-banget-input' : 'confess-aja-input';
    const input = document.getElementById(inputId);
    if (input.value.trim() === '') { alert('Confess tidak boleh kosong.'); return; }
    db.collection('confessions').add({ text: input.value, type: type, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        input.value = '';
        showPage('terima-kasih-confess');
        setTimeout(logout, 2000);
      });
}

function showPublicConfessPage() {
    const listContainer = document.getElementById('public-confess-list');
    listContainer.innerHTML = 'Memuat confess...';
    db.collection('confessions').where('type', '==', 'rahasia_aja').orderBy('timestamp', 'desc').get()
      .then(snapshot => {
        listContainer.innerHTML = '';
        if (snapshot.empty) {
            listContainer.innerHTML = '<p>Belum ada confess, jadilah yang pertama!</p>';
            return;
        }
        snapshot.forEach(doc => {
            const confessData = doc.data();
            const card = document.createElement('div');
            card.className = 'confess-card';
            card.textContent = confessData.text;
            listContainer.appendChild(card);
        });
      });
    showPage('public-confess-view');
}

// --- FUNGSI DASBOR ADMIN ---
function setupRealtimeListeners() {
    db.collection('keluhan').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('keluhan', snapshot.docs.map(doc => doc.data())));
    db.collection('ide').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('ide', snapshot.docs.map(doc => doc.data())));
    // (BARU) Listener untuk confess
    db.collection('confessions').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderAdminConfessions(snapshot.docs.map(doc => doc.data())));
}

function renderSubmissions(type, data) {
    const contentArea = document.getElementById(`admin-${type}-content`);
    renderGroupedByMonth(contentArea, data, type);
}

function renderAdminConfessions(data) {
    const contentArea = document.getElementById('admin-confess-content');
    contentArea.innerHTML = ''; // Kosongkan dulu
    
    // Pisahkan data confess berdasarkan tipenya
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
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (data.length === 0) {
        const noData = document.createElement('p');
        noData.textContent = 'Belum ada masukan.';
        container.appendChild(noData);
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
