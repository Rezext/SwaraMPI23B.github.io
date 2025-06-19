// --- PASTE KONFIGURASI FIREBASE ANDA DI SINI ---
// Ganti objek di bawah ini dengan kode yang Anda dapatkan dari Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBA0kQTRed4MuEjqojRjC3J2LiQPl6JNaY", // Ganti dengan milik Anda
    authDomain: "swara-mpi-23b.firebaseapp.com", // Ganti dengan milik Anda
    projectId: "swara-mpi-23b", // Ganti dengan milik Anda
    storageBucket: "swara-mpi-23b.firebasestorage.app", // Ganti dengan milik Anda
    messagingSenderId: "639234057858", // Ganti dengan milik Anda
    appId: "1:639234057858:web:f7d33bed0b79f21796b69b" // Ganti dengan milik Anda
};

// --- INISIALISASI FIREBASE ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Inisialisasi Firestore

// --- DAFTAR NIM TERDAFTAR (TIDAK BERUBAH) ---
const rakyatNIMs = [
    '230101050102', '230101050110', '230101050111', '230101050112', 
    '230101050113', '230101050114', '230101050115', '230101050273', 
    '230101050274', '230101050275', '230101050276', '230101050277', 
    '230101050651', '230101050652', '230101050665', '230101050666', 
    '230101050667', '230101050669', '230101050670', '230101050672', 
    '230101050674', '230101050675', '230101050676', '230101050678', 
    '230101050679', '230101050680', '230101050681', '230101050683', 
    '230101050764', '230101050765', '230101050766', '230101050768'
];
const adminNIMs = ['230101050652', '230101050111', '230101050110'];

// --- FUNGSI NAVIGASI (TIDAK BERUBAH) ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
function showRakyatLoginPage() { showPage('rakyat-login-page'); }
function showAdminLoginPage() { showPage('admin-login-page'); }
function logout() {
    document.getElementById('nim-rakyat').value = '';
    document.getElementById('nim-admin').value = '';
    showPage('rakyat-login-page');
}

// --- FUNGSI LOGIN (TIDAK BERUBAH) ---
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
        setupRealtimeListeners(); // Memulai listener real-time untuk admin
    } else {
        alert('NIM Admin tidak valid.');
    }
}

// --- FUNGSI TAB RAKYAT (TIDAK BERUBAH) ---
function showRakyatTab(tabName) {
    document.querySelectorAll('#rakyat-view .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#rakyat-view .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`rakyat-${tabName}-content`).classList.add('active');
    document.getElementById(`tab-${tabName}-rakyat`).classList.add('active');
}

// --- FUNGSI SUBMIT (MODIFIKASI UNTUK FIREBASE) ---
function submitKeluhan() {
    const input = document.getElementById('keluhan-input');
    if (input.value.trim() === '') {
        alert('Keluhan tidak boleh kosong.');
        return;
    }
    // Kirim data ke koleksi 'keluhan' di Firestore
    db.collection('keluhan').add({
        text: input.value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Timestamp dari server
    }).then(() => {
        input.value = '';
        showPage('terima-kasih-keluhan');
        setTimeout(logout, 2000);
    }).catch(error => {
        console.error("Error adding document: ", error);
        alert("Gagal mengirim keluhan. Coba lagi.");
    });
}

function submitIde() {
    const input = document.getElementById('ide-input');
    if (input.value.trim() === '') {
        alert('Ide dan Saran tidak boleh kosong.');
        return;
    }
    // Kirim data ke koleksi 'ide' di Firestore
    db.collection('ide').add({
        text: input.value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        input.value = '';
        showPage('terima-kasih-ide');
        setTimeout(logout, 2000);
    }).catch(error => {
        console.error("Error adding document: ", error);
        alert("Gagal mengirim ide. Coba lagi.");
    });
}

// --- FUNGSI DASBOR ADMIN (MODIFIKASI UNTUK REAL-TIME) ---
function showAdminTab(tabName) {
    document.querySelectorAll('#admin-view .tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#admin-view .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`admin-${tabName}-content`).classList.add('active');
    document.getElementById(`tab-${tabName}-admin`).classList.add('active');
}

function setupRealtimeListeners() {
    // Listener untuk koleksi 'keluhan'
    db.collection('keluhan').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const keluhanData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSubmissions('keluhan', keluhanData);
    });

    // Listener untuk koleksi 'ide'
    db.collection('ide').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        const ideData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSubmissions('ide', ideData);
    });
}

function renderSubmissions(type, data) {
    const contentArea = document.getElementById(`admin-${type}-content`);
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    contentArea.innerHTML = '';

    if (!data || data.length === 0) {
        contentArea.innerHTML = `<p>Belum ada masukan.</p>`;
        return;
    }
    
    const groupedByMonth = data.reduce((acc, item) => {
        if (!item.timestamp) return acc; // Lewati jika timestamp belum ada
        const date = item.timestamp.toDate();
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        
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
            // Menyesuaikan label sesuai referensi
            let label = type === 'keluhan' ? 'Keluhan' : 'Ide dan Saran';
            itemDiv.textContent = `${label} ${index + 1}: ${text}`;
            monthDiv.appendChild(itemDiv);
        });
        
        contentArea.appendChild(monthDiv);
    }
}