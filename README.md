# 🏟️ SM Sport Center
### Sistem Reservasi Lapangan Olahraga Realtime & Anti-Double Booking

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📌 Tentang Proyek

**SM Sport Center** adalah aplikasi web modern untuk pengelolaan dan pemesanan lapangan olahraga (Futsal & Badminton) secara *realtime*. Aplikasi ini menggantikan pencatatan manual berbasis buku/WhatsApp yang kerap menimbulkan masalah *double booking* dan kesalahan pencatatan transaksi.

---

## ✨ Fitur Utama

| Modul | Fitur | Deskripsi |
| :--- | :--- | :--- |
| **👤 Pengguna** | **Katalog Lapangan** | Melihat daftar lapangan beserta info slot kosong secara *realtime*. |
| | **Jadwal Interaktif** | Memeriksa ketersediaan jam operasional (08:00 – 22:00) per tanggal. |
| | **Reservasi Cepat** | Booking lapangan hanya dalam 1 klik tanpa alur rumit. |
| | **Pantau Booking** | Mengelola pesanan aktif dan melihat riwayat transaksi. |
| **👑 Administrator** | **Dashboard Analitik** | Statistik pendapatan, utilisasi lapangan, dan grafik pemesanan. |
| | **Kelola Lapangan** | Tambah, edit harga per jam, atau nonaktifkan lapangan. |
| | **Kelola Jadwal & Slot** | Mengatur jam operasional dan menandai slot *maintenance*. |
| | **Verifikasi Pembayaran** | Mengonfirmasi bukti bayar pengguna atau membatalkan pesanan. |
| **🔒 Keamanan** | **Anti Double Booking** | Pengamanan *Database Unique Constraint* (`lapangan_id`, `tanggal`, `jam`). |

---

## 🛠️ Arsitektur & Teknologi

```
Frontend (React 18 + Vite + Tailwind v4)
      │
      ├── Realtime Subscriptions (WebSockets)
      ├── REST API / Supabase JS Client
      ▼
Backend (Supabase PostgreSQL + RLS + Triggers)
```

- **Frontend:** React 18, Vite, React Router DOM, Lucide Icons
- **Styling:** Tailwind CSS v4 + Kustomisasi Design Token (*Atlassian Blue*, *Midnight Navy*)
- **Backend & Database:** Supabase PostgreSQL, GoTrue Auth, Realtime Engine

---

## 🚀 Panduan Instalasi Cepat

### 1. Kloning & Install Dependensi
```bash
git clone https://github.com/rizkyrachma/SportCenter.git
cd SportCenter
npm install
```

### 2. Konfigurasi Environment (`.env`)
Buat file `.env` di root folder dan masukkan API key Supabase Anda:
```env
VITE_SUPABASE_URL=https://project-id-anda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...anon-key-anda
```

### 3. Setup Database (Supabase SQL Editor)
Salin isi file **`supabase/migrations/001_schema.sql`** lalu jalankan (**Run**) di SQL Editor pada Dashboard Supabase Anda.

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di **http://localhost:5173**

---

## 🧪 Mode Demo / Testing

Aplikasi dilengkapi tombol **Demo Switcher** di pojok kanan bawah layar:
- **`👑 Mode: ADMIN`** — Beralih langsung ke Panel Admin (`/admin`)
- **`👤 Mode: PENGGUNA`** — Beralih langsung ke Dashboard Pengguna (`/dashboard`)

---

## 📄 Lisensi
Dilisensikan di bawah [MIT License](LICENSE).