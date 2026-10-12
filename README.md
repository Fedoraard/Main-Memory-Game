# Blackout! Misi Selamatkan Data

Game interaktif untuk materi **Main Memory** (Informatika / Teknik Komputer dan Jaringan, kelas X).
Dimainkan siswa sendiri-sendiri di HP atau laptop, sekitar 8 menit, skor penuh 100.

## Cara Menjalankan

1. Jalankan server Python (otomatis mengaktifkan database SQLite & REST API leaderboard):
   ```bash
   python server.py 8080
   ```
2. Buka di peramban (browser): [http://localhost:8080](http://localhost:8080)
3. Bagikan IP laptop ke siswa pada jaringan Wi-Fi yang sama (misal `http://192.168.1.x:8080`) agar data seluruh siswa otomatis tersimpan di database yang sama.

## Isi folder

| File | Fungsi |
|---|---|
| `server.py` | Server backend Python + SQLite + REST API Leaderboard (`/api/start`, `/api/finish`, `/api/leaderboard`) |
| `game.db` | Database SQLite penyimpanan sesi permainan dan riwayat nilai siswa |
| `index.html` | Kerangka halaman antarmuka game |
| `style.css` | Tampilan styling visual game dan tabel leaderboard |
| `script.js` | Logika game, interaksi API database, dan render papan peringkat |

## Panduan Guru & Pembelajaran

### 1. Latar Belakang & Tujuan
Materi **Main Memory** sering terasa abstrak bila hanya dijelaskan lewat ceramah. Game simulasi ini dibuat agar siswa memperoleh pengalaman langsung (*experiential learning*):
- **Akses Sekuensial vs Acak:** Merasakan langsung perbedaan lambatnya pita magnetik (harus geser berurutan) dengan kecepatan RAM (akses acak instan).
- **Sifat Volatile vs Non-Volatile:** Mengalami sendiri hilangnya data di RAM saat listrik padam (*blackout*), sementara firmware di ROM dan konfigurasi/jam di CMOS tetap terlindungi.
- **Kesiapan Konsep:** Membangun pemahaman konkret sebelum memasuki pembahasan modul ajar dan pertanyaan pemantik nomor 2.

### 2. Cara Memainkan
1. **Bagikan Tautan:** Berikan URL lokal/server (`http://...`) ke siswa. Dapat dimainkan di smartphone atau laptop via peramban tanpa perlu login.
2. **Isi Nama & Mulai:** Siswa memasukkan nama panggilan lalu menekan tombol **Mulai misi**. Waktu main sekitar 7–10 menit.
3. **Momen Penggunaan:** Sangat cocok diletakkan di fase **Pendahuluan / Apersepsi**.
4. **Refleksi Hasil:** Minta siswa menunjukkan layar hasil (skor & gelar teknisi), lalu buka diskusi kelas:
   - *Kenapa data di RAM hilang saat mati listrik?*
   - *Kenapa jam BIOS di CMOS tetap berjalan?*
   - *Kenapa mode acak di RAM jauh lebih cepat mengumpulkan poin daripada mode pita?*

### 3. Bagian-Bagian Game
- **Ronde 1 — Pita atau RAM? (Akses Berurutan vs Acak):** Siswa membandingkan Mode Pita (geser satu per satu) dengan Mode RAM (sentuh langsung alamat target), diakhiri grafik komparasi performa.
- **Ronde 2 — Blackout! (Klasifikasi RAM, ROM, CMOS):** Siswa mengalokasikan 8 data ke jenis memori yang tepat. Simulasi pemadaman listrik menunjukkan data mana yang selamat dan mana yang musnah.
- **Ronde 3 — Kuis Kilat (Penguatan Materi):** 5 pertanyaan pilihan ganda adaptif dari modul ajar berdurasi 15 detik per soal.
- **Layar Hasil & Gelar:** Menampilkan rekap skor total (maksimal 100), rincian skor tiap ronde, dan gelar teknisi siswa.

## Bagian yang mudah diubah (di `script.js`)

| Yang ingin diubah | Cari ini |
|---|---|
| Kata di 12 alamat memori ronde 1 | `var WORDS=` |
| Durasi tiap mode ronde 1 (milidetik) | `DUR=20000` di fungsi `play` |
| Batas poin ronde 1 | `Math.min(30,` di fungsi `r1Result` |
| Daftar data ronde 2 dan jawabannya (`ram`, `rom`, `cmos`) | `var ITEMS=` |
| Poin per data ronde 2 | `hits*5` di fungsi `r2Reveal` |
| Soal kuis ronde 3 (jawaban benar selalu `o[0]`, `a:0`; urutan opsi diacak otomatis) | `var QS=` |
| Waktu per soal dan poin per soal ronde 3 | `DUR=15000` dan `pts+=6` di fungsi `r3` |
| Gelar di layar hasil | `var title=` di fungsi `finish` |

Skor penuh saat ini: ronde 1 maks 30, ronde 2 maks 40 (8 data x 5), ronde 3 maks 30 (5 soal x 6).
Kalau jumlah data atau soal diubah, sesuaikan angka maksimum di fungsi `finish` (`bar('R1 / 30'...` dan seterusnya).

## Catatan materi

Pada perangkat modern, firmware BIOS atau UEFI disimpan di memori flash, yaitu jenis ROM yang bisa
ditulis ulang tetapi tetap non-volatile. CMOS disuplai oleh baterai kancing (CR2032) untuk menjaga Real-Time Clock (RTC). Game menyederhanakannya sebagai ROM dan CMOS agar sesuai dengan modul ajar.
