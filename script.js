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

// Daftar NIM dan Password terdaftar
const rakyatNIMs = ['230101050102', '230101050110', '230101050111', '230101050112', '230101050113', '230101050114', '230101050115', '230101050273', '230101050274', '230101050275', '230101050276', '230101050277', '230101050651', '230101050652', '230101050665', '230101050666', '230101050667', '230101050669', '230101050670', '230101050672', '230101050674', '230101050675', '230101050676', '230101050678', '230101050679', '230101050680', '230101050681', '230101050683', '230101050764', '230101050765', '230101050766', '230101050768'];
const adminNIMs = ['230101050652', '230101050111', '230101050110'];
const adminPassword = "swara-2025"; // Password untuk admin

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function showRakyatLoginPage() { showPage('rakyat-login-page'); }
function showAdminLoginPage() { showPage('admin-login-page'); }

function logout() {
    document.getElementById('nim-rakyat').value = '';
    document.getElementById('nim-admin').value = '';

    if (document.getElementById('password-admin')) {
        document.getElementById('password-admin').value = '';
    }
    showRakyatLoginPage();
}

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
    const password = document.getElementById('password-admin').value;

    if (adminNIMs.includes(nim) && password === adminPassword) {
        showPage('admin-view');
        showAdminTab('keluhan');
        setupRealtimeListeners();
    } else {
        alert('NIM atau Password Admin salah.');
    }
}

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

function showPublicConfessPage() {
    const listContainer = document.getElementById('public-confess-list');
    listContainer.innerHTML = '<p>Memuat confess...</p>';
    
    db.collection('confessions').where('type', '==', 'rahasia_aja').get()
      .then(snapshot => {
        if (snapshot.empty) {
            listContainer.innerHTML = '<p>Belum ada confess, jadilah yang pertama!</p>';
            return;
        }
        
        const confessions = [];
        snapshot.forEach(doc => {
            confessions.push(doc.data());
        });

        confessions.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA;
        });
        
        listContainer.innerHTML = '';
        confessions.forEach(confessData => {
            const card = document.createElement('div');
            card.className = 'confess-card';
            card.textContent = confessData.text;
            listContainer.appendChild(card);
        });

      })
      .catch(error => {
          console.error("Gagal mengambil data confess publik:", error);
          listContainer.innerHTML = '<p>Gagal memuat confess. Silakan coba lagi nanti.</p>';
      });
      
    showPage('public-confess-view');
}


function setupRealtimeListeners() {
    db.collection('keluhan').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('keluhan', snapshot.docs.map(doc => doc.data())));
    db.collection('ide').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderSubmissions('ide', snapshot.docs.map(doc => doc.data())));
    db.collection('confessions').orderBy('timestamp', 'desc').onSnapshot(snapshot => renderAdminConfessions(snapshot.docs));
}

function deleteConfession(docId) {
    if (confirm("Apakah Anda yakin ingin menghapus confess ini secara permanen?")) {
        db.collection('confessions').doc(docId).delete()
        .then(() => {
            console.log("Confession berhasil dihapus.");
        })
        .catch(error => {
            console.error("Error saat menghapus confess: ", error);
            alert("Gagal menghapus confess. Silakan coba lagi.");
        });
    }
}

function renderSubmissions(type, data) {
    const contentArea = document.getElementById(`admin-${type}-content`);
    renderGroupedByMonth(contentArea, data, type, false);
}

function renderAdminConfessions(docs) {
    const contentArea = document.getElementById('admin-confess-content');
    contentArea.innerHTML = '';
    
    const bangetDocs = docs.filter(doc => doc.data().type === 'rahasia_banget');
    const ajaDocs = docs.filter(doc => doc.data().type === 'rahasia_aja');

    const bangetTitle = document.createElement('h3');
    bangetTitle.textContent = "Confess (Rahasia Banget)";
    bangetTitle.style.marginTop = "0";
    contentArea.appendChild(bangetTitle);
    renderGroupedByMonth(contentArea, bangetDocs.map(doc => doc.data()), 'Confess', false);
    
    const ajaTitle = document.createElement('h3');
    ajaTitle.textContent = "Confess (Rahasia Aja)";
    contentArea.appendChild(ajaTitle);
    renderGroupedByMonth(contentArea, ajaDocs, 'Confess', true);
}

function renderGroupedByMonth(container, dataOrDocs, type, showDeleteButton) {
    const parentContainer = container;
    
    if (!parentContainer.querySelector('.month-group')) {
        parentContainer.innerHTML = '';
    }
    
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (dataOrDocs.length === 0) {
        if(parentContainer.innerHTML.indexOf('<p>Belum ada masukan.</p>') === -1) {
            parentContainer.innerHTML += '<p>Belum ada masukan.</p>';
        }
        return;
    }
    
    const groupedByMonth = dataOrDocs.reduce((acc, item) => {
        const data = showDeleteButton ? item.data() : item;
        if (!data.timestamp) return acc;
        const date = data.timestamp.toDate();
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!acc[key]) acc[key] = [];
        const payload = showDeleteButton ? { id: item.id, text: data.text } : { text: data.text };
        acc[key].push(payload);
        return acc;
    }, {});
    
    let htmlContent = '';
    for (const monthKey in groupedByMonth) {
        htmlContent += `<div class="month-group"><h3>${monthKey}</h3>`;
        groupedByMonth[monthKey].forEach(item => {
            htmlContent += `<div class="submission-item">
                <span class="submission-text">${item.text}</span>`;
            if (showDeleteButton) {
                htmlContent += `<button class="delete-button" onclick="deleteConfession('${item.id}')">Hapus</button>`;
            }
            htmlContent += `</div>`;
        });
        htmlContent += `</div>`;
    }
    parentContainer.innerHTML += htmlContent;
}
