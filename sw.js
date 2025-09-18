// File ini akan berjalan di background untuk menerima notifikasi

self.addEventListener('push', function(event) {
    const data = event.data.json(); // Mengambil data notifikasi dari server
    const title = data.title;
    const options = {
        body: data.body,
        icon: './icon-192.png' // Siapkan file icon jika ada
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Event listener untuk menutup notifikasi saat di-klik
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Opsional: Buka website saat notifikasi di-klik
    event.waitUntil(
        clients.openWindow('https://swarampi23b.github.io/') 
    );
});
