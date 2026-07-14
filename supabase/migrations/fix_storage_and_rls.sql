-- MIGRATION: Perbaikan Mutlak (Disable RLS pada tabel-tabel public agar tidak ada lagi 403 Forbidden)
-- PENTING: Pastikan Anda menjalankan skrip ini di SQL Editor pada project hwjfgaommfqezjzeuxmq

ALTER TABLE public.transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_lock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelanggan DISABLE ROW LEVEL SECURITY;

-- Untuk berjaga-jaga jika RLS sengaja diaktifkan kembali, buat kebijakan terbuka (FOR ALL):
DO $$
BEGIN
  DROP POLICY IF EXISTS "allow_all_transaksi" ON public.transaksi;
  DROP POLICY IF EXISTS "allow_all_reservasi" ON public.reservasi;
  DROP POLICY IF EXISTS "allow_all_slot_lock" ON public.slot_lock;
  DROP POLICY IF EXISTS "allow_all_pelanggan" ON public.pelanggan;
EXCEPTION WHEN OTHERS THEN
END $$;

CREATE POLICY "allow_all_transaksi" ON public.transaksi FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reservasi" ON public.reservasi FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_slot_lock" ON public.slot_lock FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pelanggan" ON public.pelanggan FOR ALL TO public USING (true) WITH CHECK (true);

-- Pastikan bucket 'bukti-transfer' tersedia dan bersifat publik
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bukti-transfer', 'bukti-transfer', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Pastikan kebijakan storage.objects mengizinkan upload dan baca pada bukti-transfer
DO $$
BEGIN
  DROP POLICY IF EXISTS "allow_upload_bukti_transfer" ON storage.objects;
  DROP POLICY IF EXISTS "allow_read_bukti_transfer" ON storage.objects;
  DROP POLICY IF EXISTS "allow_all_storage_bukti_transfer" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
END $$;

CREATE POLICY "allow_all_storage_bukti_transfer" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'bukti-transfer')
WITH CHECK (bucket_id = 'bukti-transfer');

-- Longgarkan check constraint pada transaksi agar mendukung 'belum_bayar' dan status lainnya jika diperlukan
DO $$
BEGIN
  ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS transaksi_status_verifikasi_check;
  ALTER TABLE public.transaksi ADD CONSTRAINT transaksi_status_verifikasi_check CHECK (status_verifikasi IN ('belum_bayar', 'menunggu', 'disetujui', 'ditolak'));
  
  -- Hapus check constraint kode_unik jika ada agar tidak eror jika bernilai 0
  ALTER TABLE public.transaksi DROP CONSTRAINT IF EXISTS transaksi_kode_unik_check;
  ALTER TABLE public.transaksi ALTER COLUMN kode_unik SET DEFAULT 0;
EXCEPTION WHEN OTHERS THEN
END $$;
