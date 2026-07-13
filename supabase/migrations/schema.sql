-- Schema migration for SM Sport Center
-- Tables: lapangan, pelanggan, reservasi, transaksi, slot_lock, admin

-- 1. Create Tables
CREATE TABLE public.lapangan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL CHECK (jenis IN ('futsal', 'badminton')),
    harga_per_jam NUMERIC NOT NULL,
    foto_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('aktif', 'nonaktif')) DEFAULT 'aktif'
);

CREATE TABLE public.pelanggan (
    id UUID PRIMARY KEY, -- references auth.users (id)
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    no_telepon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.reservasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pelanggan_id UUID NOT NULL REFERENCES public.pelanggan(id),
    lapangan_id UUID NOT NULL REFERENCES public.lapangan(id),
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending_bayar', 'menunggu_verifikasi', 'terkonfirmasi', 'dibatalkan', 'kedaluwarsa')) DEFAULT 'pending_bayar',
    total_harga NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservasi_id UUID UNIQUE NOT NULL REFERENCES public.reservasi(id) ON DELETE CASCADE,
    kode_unik INTEGER NOT NULL CHECK (kode_unik BETWEEN 100 AND 999),
    jumlah_bayar NUMERIC NOT NULL,
    metode_pembayaran TEXT NOT NULL CHECK (metode_pembayaran IN ('transfer_bank', 'qris_statis')),
    bukti_transfer_url TEXT,
    status_verifikasi TEXT NOT NULL CHECK (status_verifikasi IN ('menunggu', 'disetujui', 'ditolak')) DEFAULT 'menunggu',
    diverifikasi_oleh UUID, -- references public.admin (id)
    diverifikasi_pada TIMESTAMPTZ,
    batas_waktu_bayar TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.slot_lock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lapangan_id UUID NOT NULL REFERENCES public.lapangan(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    pelanggan_id UUID NOT NULL, -- references auth.users(id)
    dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    kedaluwarsa_pada TIMESTAMPTZ NOT NULL
);

CREATE TABLE public.admin (
    id UUID PRIMARY KEY, -- references auth.users (id)
    nama TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')) DEFAULT 'admin'
);

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
    SELECT 1 FROM public.admin WHERE id = auth.uid()
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
CREATE POLICY "lapangan_select_all" ON public.lapangan FOR SELECT TO public USING (true);
CREATE POLICY "lapangan_all_admin" ON public.lapangan FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pelanggan Policies
CREATE POLICY "pelanggan_select_self_or_admin" ON public.pelanggan FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "pelanggan_insert_self" ON public.pelanggan FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "pelanggan_update_self" ON public.pelanggan FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "pelanggan_all_admin" ON public.pelanggan FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Reservasi Policies
CREATE POLICY "reservasi_select_pemilik_atau_admin" ON public.reservasi FOR SELECT TO authenticated
USING (pelanggan_id = auth.uid() OR public.is_admin());

CREATE POLICY "reservasi_insert_milik_sendiri" ON public.reservasi FOR INSERT TO authenticated
WITH CHECK (pelanggan_id = auth.uid());

CREATE POLICY "reservasi_update_pemilik_sebelum_bayar" ON public.reservasi FOR UPDATE TO authenticated
USING (pelanggan_id = auth.uid() AND status = 'pending_bayar')
WITH CHECK (pelanggan_id = auth.uid());

CREATE POLICY "reservasi_update_admin" ON public.reservasi FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Transaksi Policies
CREATE POLICY "transaksi_select_pemilik_atau_admin" ON public.transaksi FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.reservasi r
    WHERE r.id = transaksi.reservasi_id
      AND r.pelanggan_id = auth.uid()
  )
);

CREATE POLICY "transaksi_update_upload_bukti_pemilik" ON public.transaksi FOR UPDATE TO authenticated
USING (
  diverifikasi_pada IS NULL
  AND EXISTS (
    SELECT 1 FROM public.reservasi r
    WHERE r.id = transaksi.reservasi_id
      AND r.pelanggan_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reservasi r
    WHERE r.id = transaksi.reservasi_id
      AND r.pelanggan_id = auth.uid()
  )
);

CREATE POLICY "transaksi_update_verifikasi_admin" ON public.transaksi FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Slot Lock Policies
CREATE POLICY "slot_lock_select_all" ON public.slot_lock FOR SELECT TO public USING (true);
CREATE POLICY "slot_lock_insert_all" ON public.slot_lock FOR INSERT TO authenticated WITH CHECK (pelanggan_id = auth.uid());
CREATE POLICY "slot_lock_delete_pemilik_atau_admin" ON public.slot_lock FOR DELETE TO authenticated
USING (pelanggan_id = auth.uid() OR public.is_admin());

-- Admin Policies
CREATE POLICY "admin_select_all" ON public.admin FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_superadmin" ON public.admin FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin WHERE id = auth.uid() AND role = 'superadmin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin WHERE id = auth.uid() AND role = 'superadmin'));

-- 6. Trigger for New User Profile creation (Auth Schema Sync)
-- When a user signs up on Supabase Auth, they are automatically added to public.pelanggan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into pelanggan, getting details from raw_user_meta_data if available
  INSERT INTO public.pelanggan (id, nama, email, no_telepon)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nama', 'Pelanggan Baru'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'no_telepon', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
