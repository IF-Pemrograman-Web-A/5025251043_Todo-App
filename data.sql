CREATE DATABASE IF NOT EXISTS todo_app;
USE todo_app;

DROP TABLE IF EXISTS todos;

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NULL,
    notify_time DATETIME NULL,
    notified TINYINT(1) NOT NULL DEFAULT 0,
    image VARCHAR(255) NULL,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    scope ENUM('personal', 'shared') NOT NULL DEFAULT 'personal'
);

INSERT INTO todos (title, description, due_date, notify_time, notified, image, completed, scope) VALUES
('Belajar PHP', 'Pelajari dasar PHP dan koneksi database dengan PDO.', '2026-10-25', '2026-10-24 08:00:00', 0, NULL, 0, 'personal'),
('Beli kebutuhan kuliah', 'Beli buku catatan dan alat tulis.', '2026-10-21', NULL, 0, NULL, 1, 'personal'),
('Olahraga pagi', 'Lari 30 menit di sekitar kampus.', NULL, NULL, 0, NULL, 0, 'personal'),
('Rapat organisasi', 'Diskusi program kerja bulan depan bersama seluruh anggota.', '2026-10-28', '2026-10-28 09:00:00', 0, NULL, 0, 'shared'),
('Siapkan proposal kegiatan', 'Susun proposal dan kirim ke ketua divisi untuk direview.', '2026-10-30', NULL, 0, NULL, 0, 'shared'),
('Dokumentasi acara', 'Kumpulkan foto dan video acara ke folder bersama.', '2026-10-20', NULL, 0, NULL, 1, 'shared');