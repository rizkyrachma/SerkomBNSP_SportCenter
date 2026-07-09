-- ========================================================
-- NONAKTIFKAN RLS UNTUK KEMUDAHAN TESTING TANPA AUTH
-- ========================================================
-- Jalankan script ini di Supabase -> SQL Editor
-- Agar semua halaman (Admin & Pengguna) bisa langsung baca & tulis data
-- tanpa perlu pengecekan token login.
-- ========================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lapangan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_slot DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi DISABLE ROW LEVEL SECURITY;

-- Jika ingin menyalakan kembali RLS di masa depan:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lapangan ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.jadwal_slot ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
