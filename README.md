# SM Sport Center — Sistem Web Reservasi Lapangan Olahraga

Aplikasi web reservasi lapangan olahraga profesional untuk **SM Sport Center** (memiliki **2 Lapangan Futsal** dan **3 Lapangan Badminton**). Aplikasi dirancang dengan desain SaaS premium bergaya **Relate Style Reference** (Snow Canvas `#fcfcfc`, Lavender Wash `#f0f4fe`, Midnight Ink `#020520`, Royal Signal `#145aff`, serta status dots dan pill buttons).

---

## 🌟 Fitur Utama

### 1. Autentikasi & RBAC (Role-Based Access Control)
- **Login & Register**: Menggunakan Supabase Auth (email + password) atau **Mode Demo Instan**.
- **Role Pengguna**: `admin` dan `pelanggan` yang dikelola secara terintegrasi dengan tabel `profiles`.
- **Protected Routes**: Otomatis mengarahkan ke halaman yang sesuai role dan memproteksi rute sensitif.

### 2. Portal Pelanggan
- **Jadwal & Ketersediaan Real-Time**: Grid jam operasional interaktif (**08:00 – 23:00**) untuk semua lapangan. Slot yang sudah dipesan terkunci secara otomatis.
- **Perhitungan Harga Otomatis**: Menghitung biaya pemesanan berdasarkan durasi main dikalikan harga per jam fasilitas.
- **Validasi Jadwal Bentrok Ganda**: Divalidasi di sisi aplikasi dan diamankan di sisi database PostgreSQL melalui **Exclusion Constraint** (`EXCLUDE USING gist`) dan **RPC Function**.
- **Booking Saya & Simulasi Pembayaran Instan**: Daftar riwayat pemesanan lengkap dengan tombol **"Bayar Sekarang"** pada reservasi berstatus `pending` yang langsung mengubah status menjadi `dikonfirmasi` (Lunas).

### 3. Portal Admin
- **Dashboard Statistik**: Laporan eksekutif meliputi Total Reservasi, Total Pendapatan, dan Okupansi per lapangan beserta filter tanggal.
- **Kelola Reservasi**: Manajemen seluruh pemesanan dari semua pelanggan, pencarian cepat, filter status, ubah status manual (`selesai`, `dibatalkan`, `dikonfirmasi`), dan hapus data.
- **Kelola Lapangan**: CRUD lengkap fasilitas lapangan (Tambah Lapangan Baru, Edit Harga per Jam, Switch Aktif/Nonaktif, Hapus).

---

## 🛠️ Stack Teknologi

- **Frontend**: React 18 (Vite), Tailwind CSS v4, React Router DOM v6, Lucide Icons.
- **Backend & Database**: Supabase (PostgreSQL 15+, Row Level Security, RPC Functions, Extension `btree_gist`).
- **Deployment**: Vercel (SPA Rewrite via `vercel.json`).

---

## ⚡ Pengujian Cepat Prototipe (tanpa API Key Supabase)

Aplikasi dilengkapi dengan **Engine Demo Storage** built-in. Anda dapat langsung menjalankan dan menguji seluruh alur prototipe secara sempurna di komputer lokal tanpa perlu mengatur kredensial Supabase terlebih dahulu!

1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka browser di `http://localhost:5173`.
4. Klik tombol **"Masuk sbg Admin"** atau **"Masuk sbg Pelanggan"** pada halaman Login atau Home untuk langsung mengeksplorasi aplikasi.

---

## 🗄️ Langkah Setup Database Supabase (Untuk Production)

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, salin seluruh isi file [`database/schema.sql`](./database/schema.sql), lalu klik **Run**. Script ini akan:
   - Mengaktifkan ekstensi `uuid-ossp` dan `btree_gist`.
   - Membuat tabel `lapangan`, `profiles`, dan `reservasi`.
   - Membuat Trigger otomatis untuk menyinkronkan user baru ke tabel `profiles`.
   - Memasang **Exclusion Constraint** pencegah jadwal bentrok:
     ```sql
     ALTER TABLE reservasi ADD CONSTRAINT cegah_jadwal_bentrok
     EXCLUDE USING gist (
       id_lapangan WITH =,
       tsrange((tanggal + jam_mulai)::timestamp, (tanggal + jam_selesai)::timestamp) WITH &&
     ) WHERE (status <> 'dibatalkan');
     ```
   - Membuat fungsi RPC: `cek_ketersediaan_lapangan`, `buat_reservasi_aman`, dan `get_dashboard_stats`.
   - Mengaktifkan kebijakan **Row Level Security (RLS)**.
   - Memasukkan data awal 5 lapangan (2 Futsal dan 3 Badminton).

3. **Cara Membuat Akun Admin Pertama**:
   - Daftarkan akun baru di halaman Register atau Supabase Auth Dashboard (misalnya `admin@smsport.com`).
   - Buka Supabase SQL Editor dan jalankan perintah:
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'admin@smsport.com';
     ```

4. **Konfigurasi Environment Variables**:
   - Salin `.env.example` menjadi `.env`:
     ```env
     VITE_SUPABASE_URL="https://your-project.supabase.co"
     VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
     ```

---

## 🚀 Panduan Deploy ke Vercel

1. Push repositori ini ke GitHub / GitLab.
2. Buka [Vercel Dashboard](https://vercel.com) -> **Add New Project** -> Import repositori.
3. Di bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Vercel akan membaca `vercel.json` secara otomatis untuk menangani routing SPA React Router.
5. **Penting (Supabase Auth Config)**: Di Supabase Dashboard -> **Authentication** -> **URL Configuration**, tambahkan domain Vercel Anda ke dalam **Site URL** dan **Redirect URLs**.
