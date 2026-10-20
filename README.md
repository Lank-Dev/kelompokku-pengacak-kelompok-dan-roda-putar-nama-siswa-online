# 🎡 KocokNama - Wheel of Names Indonesia

Aplikasi web roda putar nama acak (Spin the Wheel / Random Picker) interaktif dengan animasi fisika deselerasi dramatis, efek suara prosedural Web Audio API, selebrasi konfeti, kustomisasi tema, dan manajemen entri nama yang praktis.

Terinspirasi dari [Wheel of Names](https://wheelofnames.com/).

---

## ✨ Fitur Utama

- 🎯 **Fisika Roda Realistis (HTML5 Canvas 2D)**:
  - Deselerasi alami berbasis *Quintic Ease-Out* yang menegangkan saat mendekati garis finis.
  - Pointer/flapper mekanis di sisi kanan yang bergetar (*spring bounce deflection*) setiap kali pasak/garis pemisah lewat.
  - Penyesuaian ukuran teks dinamis serta kontras teks otomatis (hitam/putih) sesuai kecerahan warna wedge (ITU-R BT.709).
  - Mendukung 2 hingga ratusan nama sekaligus tanpa tumpang tindih.

- 🔊 **Procedural Web Audio Engine**:
  - Efek suara klik pasak (*ticker peg click*) yang berubah frekuensi dan nadanya sesuai kecepatan putaran.
  - Suara *whoosh* saat pertama kali roda diputar.
  - Fanfare kemenangan (*celebration synth arpeggio*) saat jarum berhenti di nama pemenang.
  - **100% Bebas File Audio Eksternal**: Berjalan instan secara offline tanpa lag loading mp3.

- 📝 **Manajemen Daftar Entri**:
  - Mode Teks Area (ketik atau salin-tempel langsung banyak baris) & Mode Chip Item.
  - Tombol **Acak (Shuffle)** & **Urutkan (A-Z)**.
  - **Preset Indonesia**: Nama Murid/Siswa, Nomor 1-20, Doorprize Hadiah, Menu Makan Siang, Ya/Tidak.
  - Ekspor daftar ke file `.txt` dan salin ke clipboard.

- 🏆 **Selebrasi Pemenang**:
  - Ledakan konfeti warna-warni (*center burst + continuous side cannons*).
  - Modal pemenang dengan tampilan nama besar dan nomor putaran.
  - Tombol **Hapus Pemenang** (agar pemenang tidak terpilih dua kali pada arisan/doorprize).
  - Tombol **Putar Lagi** langsung dari modal.

- 📜 **Riwayat Pemenang (History)**:
  - Pencatatan seluruh pemenang per putaran lengkap dengan timestamp.
  - Salin seluruh daftar pemenang ke clipboard atau bersihkan riwayat.

- ⚙️ **Pengaturan & Kustomisasi**:
  - Slider durasi putaran (3s - 20s).
  - Toggle saklar suara & animasi konfeti.
  - Kustomisasi pesan ucapan kemenangan (mendukung tag `{name}`).
  - 6 Pilihan Tema Warna (Pelangi Klasik, Neon Cyberpunk, Pastel Dream, Sunset Ocean, Emerald Gold, Dark Slate).
  - Mode Layar Penuh (Fullscreen) untuk proyektor/presentasi/live streaming.
  - Pintasan Keyboard: **Spacebar** / **Enter** untuk memutar roda, **Esc** untuk menutup popup.

---

## 🚀 Cara Menjalankan

### Persyaratan:
- Node.js (v18+) & npm

### Menjalankan di Mode Development:
```bash
# Masuk ke direktori
cd "c:\Users\HYPE AMD\files\PROJECT\PERSONAL\name kocoker"

# Jalankan dev server
npm run dev
```
Akses di browser: `http://localhost:5173`

### Membangun Versi Produksi:
```bash
npm run build
```
File siap rilis tersedia di folder `dist/`.

---

## 🛠️ Tech Stack
- **React 19**
- **Vite**
- **TypeScript**
- **Tailwind CSS v4**
- **Canvas 2D Rendering API**
- **Web Audio API**
- **canvas-confetti**
- **Lucide Icons**
