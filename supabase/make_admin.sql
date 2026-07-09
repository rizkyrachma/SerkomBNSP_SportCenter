-- ========================================================
-- 1. AKTIFKAN (KONFIRMASI) SEMUA EMAIL USER AGAR TIDAK ADA ERROR "EMAIL NOT CONFIRMED"
-- ========================================================
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- ========================================================
-- 2. JADIKAN AKUN user123@gmail.com SEBAGAI ADMIN
-- ========================================================
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'de0fa8fc-a230-4708-be86-0f1281673187';

-- Cek hasil akhir
SELECT u.email, u.email_confirmed_at, p.role, p.nama_lengkap
FROM auth.users u
JOIN public.profiles p ON p.id = u.id;
