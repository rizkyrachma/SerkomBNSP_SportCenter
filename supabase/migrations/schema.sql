-- Schema migration for SM Sport Center
-- Tables: lapangan, pelanggan, reservasi, transaksi, slot_lock, admin

-- 0. Bersihkan tabel lama berformat UUID agar dibuat ulang dengan format TEXT (ADM0001, PLG0001, l-futsal-1)
DROP TABLE IF EXISTS public.transaksi CASCADE;
DROP TABLE IF EXISTS public.slot_lock CASCADE;
DROP TABLE IF EXISTS public.reservasi CASCADE;
DROP TABLE IF EXISTS public.lapangan CASCADE;
DROP TABLE IF EXISTS public.pelanggan CASCADE;
DROP TABLE IF EXISTS public.admin CASCADE;

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.lapangan (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL CHECK (jenis IN ('futsal', 'badminton')),
    harga_per_jam NUMERIC NOT NULL,
    foto_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('aktif', 'nonaktif')) DEFAULT 'aktif'
);

CREATE TABLE IF NOT EXISTS public.pelanggan (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    no_telepon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pelanggan_id TEXT NOT NULL REFERENCES public.pelanggan(id),
    lapangan_id TEXT NOT NULL REFERENCES public.lapangan(id),
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_bayar', 'menunggu_verifikasi', 'terkonfirmasi', 'dibatalkan', 'kedaluwarsa')) DEFAULT 'pending_bayar',
    total_harga NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservasi_id UUID UNIQUE NOT NULL REFERENCES public.reservasi(id) ON DELETE CASCADE,
    kode_unik INTEGER NOT NULL CHECK (kode_unik BETWEEN 100 AND 999),
    jumlah_bayar NUMERIC NOT NULL,
    metode_pembayaran TEXT NOT NULL CHECK (metode_pembayaran IN ('transfer_bank', 'qris_statis')),
    bukti_transfer_url TEXT,
    status_verifikasi TEXT NOT NULL CHECK (status_verifikasi IN ('menunggu', 'disetujui', 'ditolak')) DEFAULT 'menunggu',
    diverifikasi_oleh TEXT, -- references public.admin (id)
    diverifikasi_pada TIMESTAMPTZ,
    batas_waktu_bayar TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.slot_lock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lapangan_id TEXT NOT NULL REFERENCES public.lapangan(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    pelanggan_id TEXT NOT NULL, -- references public.pelanggan(id)
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    kedaluwarsa_pada TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')) DEFAULT 'admin'
);

-- Restore Foreign Keys Safely
DO $$ BEGIN
  ALTER TABLE public.reservasi ADD CONSTRAINT reservasi_lapangan_id_fkey FOREIGN KEY (lapangan_id) REFERENCES public.lapangan(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.reservasi ADD CONSTRAINT reservasi_pelanggan_id_fkey FOREIGN KEY (pelanggan_id) REFERENCES public.pelanggan(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.slot_lock ADD CONSTRAINT slot_lock_lapangan_id_fkey FOREIGN KEY (lapangan_id) REFERENCES public.lapangan(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create Storage Buckets (must be run on Supabase storage schema)
-- Note: In Supabase, bucket creation can be done via SQL or Dashboard.
-- insert into storage.buckets (id, name, public) values ('lapangan-photos', 'lapangan-photos', true);
-- insert into storage.buckets (id, name, public) values ('bukti-transfer', 'bukti-transfer', false);

-- 3. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email') AND role = 'superadmin'
  );
$$;

-- 4. Enable Row Level Security
ALTER TABLE public.lapangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_lock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Lapangan Policies
DROP POLICY IF EXISTS "lapangan_select_all" ON public.lapangan;
CREATE POLICY "lapangan_select_all" ON public.lapangan FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "lapangan_all_admin" ON public.lapangan;
CREATE POLICY "lapangan_all_admin" ON public.lapangan FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pelanggan Policies
DROP POLICY IF EXISTS "pelanggan_select_self_or_admin" ON public.pelanggan;
CREATE POLICY "pelanggan_select_self_or_admin" ON public.pelanggan FOR SELECT TO authenticated
USING (email = (auth.jwt() ->> 'email') OR public.is_admin());
DROP POLICY IF EXISTS "pelanggan_insert_self" ON public.pelanggan;
CREATE POLICY "pelanggan_insert_self" ON public.pelanggan FOR INSERT TO authenticated
WITH CHECK (email = (auth.jwt() ->> 'email') OR public.is_admin());
DROP POLICY IF EXISTS "pelanggan_update_self" ON public.pelanggan;
CREATE POLICY "pelanggan_update_self" ON public.pelanggan FOR UPDATE TO authenticated
USING (email = (auth.jwt() ->> 'email')) WITH CHECK (email = (auth.jwt() ->> 'email'));
DROP POLICY IF EXISTS "pelanggan_all_admin" ON public.pelanggan;
CREATE POLICY "pelanggan_all_admin" ON public.pelanggan FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Reservasi Policies
DROP POLICY IF EXISTS "reservasi_select_pemilik_atau_admin" ON public.reservasi;
CREATE POLICY "reservasi_select_pemilik_atau_admin" ON public.reservasi FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pelanggan p WHERE p.id = reservasi.pelanggan_id AND p.email = (auth.jwt() ->> 'email'))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "reservasi_insert_milik_sendiri" ON public.reservasi;
CREATE POLICY "reservasi_insert_milik_sendiri" ON public.reservasi FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pelanggan p WHERE p.id = reservasi.pelanggan_id AND p.email = (auth.jwt() ->> 'email'))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "reservasi_update_pemilik_sebelum_bayar" ON public.reservasi;
CREATE POLICY "reservasi_update_pemilik_sebelum_bayar" ON public.reservasi FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pelanggan p WHERE p.id = reservasi.pelanggan_id AND p.email = (auth.jwt() ->> 'email'))
  AND status = 'pending_bayar'
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pelanggan p WHERE p.id = reservasi.pelanggan_id AND p.email = (auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "reservasi_update_admin" ON public.reservasi;
CREATE POLICY "reservasi_update_admin" ON public.reservasi FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Transaksi Policies
DROP POLICY IF EXISTS "transaksi_select_pemilik_atau_admin" ON public.transaksi;
CREATE POLICY "transaksi_select_pemilik_atau_admin" ON public.transaksi FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.reservasi r
    JOIN public.pelanggan p ON p.id = r.pelanggan_id
    WHERE r.id = transaksi.reservasi_id
      AND p.email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "transaksi_update_upload_bukti_pemilik" ON public.transaksi;
CREATE POLICY "transaksi_update_upload_bukti_pemilik" ON public.transaksi FOR UPDATE TO authenticated
USING (
  diverifikasi_pada IS NULL
  AND EXISTS (
    SELECT 1 FROM public.reservasi r
    JOIN public.pelanggan p ON p.id = r.pelanggan_id
    WHERE r.id = transaksi.reservasi_id
      AND p.email = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservasi r
    JOIN public.pelanggan p ON p.id = r.pelanggan_id
    WHERE r.id = transaksi.reservasi_id
      AND p.email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "transaksi_update_verifikasi_admin" ON public.transaksi;
CREATE POLICY "transaksi_update_verifikasi_admin" ON public.transaksi FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Slot Lock Policies
DROP POLICY IF EXISTS "slot_lock_select_all" ON public.slot_lock;
CREATE POLICY "slot_lock_select_all" ON public.slot_lock FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "slot_lock_insert_all" ON public.slot_lock;
CREATE POLICY "slot_lock_insert_all" ON public.slot_lock FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pelanggan p WHERE p.id = slot_lock.pelanggan_id AND p.email = (auth.jwt() ->> 'email'))
  OR public.is_admin()
);
DROP POLICY IF EXISTS "slot_lock_delete_pemilik_atau_admin" ON public.slot_lock;
CREATE POLICY "slot_lock_delete_pemilik_atau_admin" ON public.slot_lock FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.pelanggan p WHERE p.id = slot_lock.pelanggan_id AND p.email = (auth.jwt() ->> 'email'))
  OR public.is_admin()
);

-- Admin Policies
DROP POLICY IF EXISTS "admin_select_all" ON public.admin;
CREATE POLICY "admin_select_all" ON public.admin FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_all_superadmin" ON public.admin;
CREATE POLICY "admin_all_superadmin" ON public.admin FOR ALL TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- 6. Trigger for New User Profile creation (Auth Schema Sync)
-- When a user signs up on Supabase Auth, they are automatically added to public.pelanggan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_new_id TEXT;
BEGIN
  BEGIN
    v_new_id := 'PLG' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    INSERT INTO public.pelanggan (id, nama, email, no_telepon)
    VALUES (
      v_new_id,
      COALESCE(new.raw_user_meta_data->>'nama', 'Pelanggan Baru'),
      new.email,
      COALESCE(new.raw_user_meta_data->>'no_telepon', '-')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors to prevent block on auth signup
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Seeding Data Awal (Migrasi Data Lapangan)
INSERT INTO public.lapangan (id, nama, jenis, harga_per_jam, foto_url, status)
VALUES
  (
    'l-futsal-1',
    'Lapangan Futsal 1',
    'futsal',
    150000,
    'https://images.unsplash.com/photo-1577223625856-74367e918170?q=80&w=600&auto=format&fit=crop',
    'aktif'
  ),
  (
    'l-futsal-2',
    'Lapangan Futsal 2',
    'futsal',
    150000,
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=600&auto=format&fit=crop',
    'aktif'
  ),
  (
    'l-badminton-1',
    'Lapangan Badminton 1',
    'badminton',
    50000,
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop',
    'aktif'
  ),
  (
    'l-badminton-2',
    'Lapangan Badminton 2',
    'badminton',
    50000,
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop',
    'aktif'
  ),
  (
    'l-badminton-3',
    'Lapangan Badminton 3',
    'badminton',
    50000,
    'https://images.unsplash.com/photo-1613918431208-6752fe2faa7a?q=80&w=600&auto=format&fit=crop',
    'aktif'
  )
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  jenis = EXCLUDED.jenis,
  harga_per_jam = EXCLUDED.harga_per_jam,
  foto_url = EXCLUDED.foto_url,
  status = EXCLUDED.status;

-- 8. Seeding Akun Admin & Pelanggan agar bisa langsung Login (email & password: password)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id UUID := '11111111-1111-1111-1111-111111111111'::UUID;
  v_pelanggan_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
  v_rizky_id UUID := '33333333-3333-3333-3333-333333333333'::UUID;
BEGIN
  -- 1. Akun Admin (email: admin@smsportcenter.com | password: password)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
    'admin@smsportcenter.com', extensions.crypt('password', extensions.gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"nama": "Administrator SM Sport"}', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_admin_id, v_admin_id, format('{"sub": "%s", "email": "%s"}', v_admin_id, 'admin@smsportcenter.com')::jsonb,
    'email', v_admin_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.admin (id, nama, email, role)
  VALUES ('ADM0001', 'Administrator SM Sport', 'admin@smsportcenter.com', 'superadmin')
  ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email, role = EXCLUDED.role;

  -- 2. Akun Pelanggan Demo (email: pelanggan@gmail.com | password: password)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_pelanggan_id, 'authenticated', 'authenticated',
    'pelanggan@gmail.com', extensions.crypt('password', extensions.gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"nama": "Pelanggan Demo", "no_telepon": "081234567890"}', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_pelanggan_id, v_pelanggan_id, format('{"sub": "%s", "email": "%s"}', v_pelanggan_id, 'pelanggan@gmail.com')::jsonb,
    'email', v_pelanggan_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.pelanggan (id, nama, email, no_telepon)
  VALUES ('PLG0001', 'Pelanggan Demo', 'pelanggan@gmail.com', '081234567890')
  ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email, no_telepon = EXCLUDED.no_telepon;

  -- 3. Akun Pelanggan Rizky (email: rizky@gmail.com | password: password)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', v_rizky_id, 'authenticated', 'authenticated',
    'rizky@gmail.com', extensions.crypt('password', extensions.gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"nama": "Rizky Rachma", "no_telepon": "081299887766"}', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    v_rizky_id, v_rizky_id, format('{"sub": "%s", "email": "%s"}', v_rizky_id, 'rizky@gmail.com')::jsonb,
    'email', v_rizky_id::text, NOW(), NOW(), NOW()
  )
  ON CONFLICT (provider_id, provider) DO NOTHING;

  INSERT INTO public.pelanggan (id, nama, email, no_telepon)
  VALUES ('PLG0002', 'Rizky Rachma', 'rizky@gmail.com', '081299887766')
  ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, email = EXCLUDED.email, no_telepon = EXCLUDED.no_telepon;

END $$;
