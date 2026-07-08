-- ====================================================================
-- SM SPORT CENTER — SISTEM RESERVASI LAPANGAN OLAHRAGA
-- Skema Database Supabase (PostgreSQL 15+)
-- ====================================================================

-- 0. Aktifkan Ekstensi yang Dibutuhkan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ====================================================================
-- 1. TABEL LAPANGAN
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.lapangan (
    id SERIAL PRIMARY KEY,
    nama_lapangan VARCHAR(100) NOT NULL,
    jenis VARCHAR(50) NOT NULL CHECK (jenis IN ('futsal', 'badminton')),
    harga_per_jam INTEGER NOT NULL CHECK (harga_per_jam >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    deskripsi TEXT,
    gambar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. TABEL PROFILES (Terhubung ke auth.users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    no_hp VARCHAR(30),
    alamat TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'pelanggan' CHECK (role IN ('admin', 'pelanggan')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger Otomatis untuk membuat baris profiles setiap ada user baru mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nama, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'pelanggan')
    )
    ON CONFLICT (id) DO UPDATE
    SET nama = EXCLUDED.nama,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 3. TABEL RESERVASI
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.reservasi (
    id_reservasi UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pelanggan UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_lapangan INTEGER NOT NULL REFERENCES public.lapangan(id) ON DELETE RESTRICT,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'dikonfirmasi', 'selesai', 'dibatalkan')),
    total_bayar INTEGER NOT NULL CHECK (total_bayar >= 0),
    id_transaksi VARCHAR(16),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT validasi_rentang_jam CHECK (jam_selesai > jam_mulai)
);

-- ====================================================================
-- 4. EXCLUSION CONSTRAINT (Mencegah Jadwal Bentrok / Double Booking)
-- Menggunakan btree_gist agar overlap waktu ditolak secara atomik di PostgreSQL
-- ====================================================================
ALTER TABLE public.reservasi 
DROP CONSTRAINT IF EXISTS cegah_jadwal_bentrok;

ALTER TABLE public.reservasi 
ADD CONSTRAINT cegah_jadwal_bentrok
EXCLUDE USING gist (
    id_lapangan WITH =,
    tsrange(
        (tanggal + jam_mulai)::timestamp,
        (tanggal + jam_selesai)::timestamp
    ) WITH &&
) WHERE (status <> 'dibatalkan');

-- ====================================================================
-- 5. INDEX UNTUK PERFORMA QUERY
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_reservasi_tanggal ON public.reservasi(tanggal);
CREATE INDEX IF NOT EXISTS idx_reservasi_id_lapangan ON public.reservasi(id_lapangan);
CREATE INDEX IF NOT EXISTS idx_reservasi_id_pelanggan ON public.reservasi(id_pelanggan);
CREATE INDEX IF NOT EXISTS idx_reservasi_status ON public.reservasi(status);

-- ====================================================================
-- 6. RPC FUNCTIONS
-- ====================================================================

-- A. Fungsi Cek Ketersediaan Lapangan pada Tanggal Tertentu
CREATE OR REPLACE FUNCTION public.cek_ketersediaan_lapangan(
    p_tanggal DATE,
    p_id_lapangan INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id_reservasi UUID,
    id_lapangan INTEGER,
    tanggal DATE,
    jam_mulai TIME,
    jam_selesai TIME,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id_reservasi,
        r.id_lapangan,
        r.tanggal,
        r.jam_mulai,
        r.jam_selesai,
        r.status
    FROM public.reservasi r
    WHERE r.tanggal = p_tanggal
      AND r.status <> 'dibatalkan'
      AND (p_id_lapangan IS NULL OR r.id_lapangan = p_id_lapangan)
    ORDER BY r.jam_mulai ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Fungsi Pembuatan Reservasi Aman (Cek Overlap + Insert Atomik)
CREATE OR REPLACE FUNCTION public.buat_reservasi_aman(
    p_id_pelanggan UUID,
    p_id_lapangan INTEGER,
    p_tanggal DATE,
    p_jam_mulai TIME,
    p_jam_selesai TIME,
    p_total_bayar INTEGER,
    p_catatan TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_bentrok_count INTEGER;
    v_id_reservasi UUID;
    v_new_row RECORD;
BEGIN
    -- Cek awal overlap di sisi server (hanya menghitung status aktif / bukan dibatalkan)
    SELECT COUNT(*) INTO v_bentrok_count
    FROM public.reservasi
    WHERE id_lapangan = p_id_lapangan
      AND tanggal = p_tanggal
      AND status <> 'dibatalkan'
      AND (jam_mulai < p_jam_selesai AND jam_selesai > p_jam_mulai);

    IF v_bentrok_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Jadwal bentrok! Lapangan sudah dipesan pada jam tersebut.'
        );
    END IF;

    -- Lakukan insert (jika terjadi race condition, exclusion constraint akan melempar exception)
    INSERT INTO public.reservasi (
        id_pelanggan,
        id_lapangan,
        tanggal,
        jam_mulai,
        jam_selesai,
        status,
        total_bayar,
        id_transaksi,
        catatan
    ) VALUES (
        p_id_pelanggan,
        p_id_lapangan,
        p_tanggal,
        p_jam_mulai,
        p_jam_selesai,
        'pending',
        p_total_bayar,
        'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        p_catatan
    )
    RETURNING * INTO v_new_row;

    RETURN json_build_object(
        'success', true,
        'message', 'Reservasi berhasil dibuat',
        'data', row_to_json(v_new_row)
    );
EXCEPTION
    WHEN exclusion_violation THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Jadwal bentrok terdeteksi oleh sistem (Exclusion Constraint).'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Gagal membuat reservasi: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TABEL TRANSAKSI (RIWAYAT PEMBAYARAN TERPISAH)
CREATE TABLE IF NOT EXISTS public.transaksi (
    id_transaksi UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_reservasi UUID REFERENCES public.reservasi(id_reservasi) ON DELETE CASCADE,
    id_pelanggan UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    kode_transaksi TEXT NOT NULL,
    jumlah_bayar BIGINT NOT NULL,
    metode_bayar TEXT NOT NULL DEFAULT 'QRIS / Virtual Account (Simulasi)',
    status TEXT NOT NULL DEFAULT 'berhasil',
    waktu_bayar TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk efisiensi kueri riwayat dan dashboard admin
CREATE INDEX IF NOT EXISTS idx_transaksi_id_reservasi ON public.transaksi(id_reservasi);
CREATE INDEX IF NOT EXISTS idx_transaksi_id_pelanggan ON public.transaksi(id_pelanggan);

-- Trigger otomatis: Saat transaksi tercatat berhasil, status reservasi terkait otomatis dikonfirmasi
CREATE OR REPLACE FUNCTION public.sync_status_reservasi_setelah_transaksi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'berhasil' THEN
        UPDATE public.reservasi
        SET status = 'dikonfirmasi'
        WHERE id_reservasi = NEW.id_reservasi;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaksi_berhasil ON public.transaksi;
CREATE TRIGGER on_transaksi_berhasil
AFTER INSERT OR UPDATE ON public.transaksi
FOR EACH ROW
EXECUTE FUNCTION public.sync_status_reservasi_setelah_transaksi();

-- C. Fungsi Dashboard Statistik Admin (Menghitung Total Pendapatan dari Tabel TRANSAKSI)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_total_reservasi INTEGER;
    v_total_pendapatan BIGINT;
    v_okupansi JSON;
BEGIN
    -- Hitung total reservasi (tidak dibatalkan)
    SELECT COUNT(*) INTO v_total_reservasi
    FROM public.reservasi
    WHERE status <> 'dibatalkan'
      AND (p_start_date IS NULL OR tanggal >= p_start_date)
      AND (p_end_date IS NULL OR tanggal <= p_end_date);

    -- Hitung total pendapatan dari TABEL TRANSAKSI (hanya yang status 'berhasil')
    SELECT COALESCE(SUM(t.jumlah_bayar), 0) INTO v_total_pendapatan
    FROM public.transaksi t
    JOIN public.reservasi r ON t.id_reservasi = r.id_reservasi
    WHERE t.status = 'berhasil'
      AND (p_start_date IS NULL OR r.tanggal >= p_start_date)
      AND (p_end_date IS NULL OR r.tanggal <= p_end_date);

    -- Okupansi per lapangan (termasuk pendapatan dari transaksi yang berhasil)
    SELECT json_agg(okup) INTO v_okupansi
    FROM (
        SELECT 
            l.id,
            l.nama_lapangan,
            l.jenis,
            COUNT(DISTINCT r.id_reservasi) as total_booking,
            COALESCE(SUM(EXTRACT(EPOCH FROM (r.jam_selesai - r.jam_mulai))/3600), 0) as total_jam_terpakai,
            COALESCE(SUM(CASE WHEN tx.status = 'berhasil' THEN tx.jumlah_bayar ELSE 0 END), 0) as pendapatan_lapangan
        FROM public.lapangan l
        LEFT JOIN public.reservasi r ON l.id = r.id_lapangan 
             AND r.status <> 'dibatalkan'
             AND (p_start_date IS NULL OR r.tanggal >= p_start_date)
             AND (p_end_date IS NULL OR r.tanggal <= p_end_date)
        LEFT JOIN public.transaksi tx ON r.id_reservasi = tx.id_reservasi
        GROUP BY l.id, l.nama_lapangan, l.jenis
        ORDER BY l.id
    ) okup;

    RETURN json_build_object(
        'total_reservasi', COALESCE(v_total_reservasi, 0),
        'total_pendapatan', COALESCE(v_total_pendapatan, 0),
        'okupansi_lapangan', COALESCE(v_okupansi, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.lapangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

-- Policy Lapangan: Semua orang bisa melihat lapangan aktif, Admin bisa ubah
DROP POLICY IF EXISTS "Semua orang bisa lihat lapangan" ON public.lapangan;
CREATE POLICY "Semua orang bisa lihat lapangan"
ON public.lapangan FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin kelola lapangan" ON public.lapangan;
CREATE POLICY "Admin kelola lapangan"
ON public.lapangan FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy Profiles: Pengguna bisa baca & ubah miliknya, Admin bisa lihat semua
DROP POLICY IF EXISTS "Pengguna lihat profil sendiri atau admin" ON public.profiles;
CREATE POLICY "Pengguna lihat profil sendiri atau admin"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Pengguna ubah profil sendiri" ON public.profiles;
CREATE POLICY "Pengguna ubah profil sendiri"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy Reservasi: Pelanggan lihat & kelola miliknya, Admin bisa kelola semua
DROP POLICY IF EXISTS "Pelanggan lihat reservasi miliknya atau admin" ON public.reservasi;
CREATE POLICY "Pelanggan lihat reservasi miliknya atau admin"
ON public.reservasi FOR SELECT
USING (
    id_pelanggan = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Pelanggan buat reservasi" ON public.reservasi;
CREATE POLICY "Pelanggan buat reservasi"
ON public.reservasi FOR INSERT
WITH CHECK (id_pelanggan = auth.uid());

DROP POLICY IF EXISTS "Pelanggan ubah reservasi miliknya atau admin" ON public.reservasi;
CREATE POLICY "Pelanggan ubah reservasi miliknya atau admin"
ON public.reservasi FOR UPDATE
USING (
    id_pelanggan = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin hapus reservasi" ON public.reservasi;
CREATE POLICY "Admin hapus reservasi"
ON public.reservasi FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy Transaksi: Pelanggan lihat & buat transaksi miliknya, Admin bisa kelola semua
DROP POLICY IF EXISTS "Pelanggan lihat transaksi miliknya atau admin" ON public.transaksi;
CREATE POLICY "Pelanggan lihat transaksi miliknya atau admin"
ON public.transaksi FOR SELECT
USING (
    id_pelanggan = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Pelanggan buat transaksi" ON public.transaksi;
CREATE POLICY "Pelanggan buat transaksi"
ON public.transaksi FOR INSERT
WITH CHECK (id_pelanggan = auth.uid());

DROP POLICY IF EXISTS "Admin kelola transaksi" ON public.transaksi;
CREATE POLICY "Admin kelola transaksi"
ON public.transaksi FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ====================================================================
-- 8. DATA AWAL (SEED DATA) — 5 LAPANGAN (2 FUTSAL, 3 BADMINTON)
-- ====================================================================

INSERT INTO public.lapangan (nama_lapangan, jenis, harga_per_jam, status, deskripsi, gambar_url)
VALUES
    ('Futsal Arena A (Vinyl Standard Pro)', 'futsal', 150000, 'aktif', 'Lapangan futsal lantai vinyl kualitas standar FIFA dengan lampu LED 800 lux.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'),
    ('Futsal Arena B (Rumput Sintetis Pro)', 'futsal', 140000, 'aktif', 'Lapangan futsal rumput sintetis premium yang nyaman dan empuk.', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80'),
    ('Badminton Court 1 (Karpet Yonex Pro)', 'badminton', 65000, 'aktif', 'Lapangan badminton karpet badminton antislip profesional.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'),
    ('Badminton Court 2 (Karpet Yonex Pro)', 'badminton', 65000, 'aktif', 'Lapangan badminton karpet badminton antislip profesional.', 'https://images.unsplash.com/photo-1613918431703-92f7e02e1c79?auto=format&fit=crop&w=800&q=80'),
    ('Badminton Court 3 (Lantai Kayu Parquet)', 'badminton', 60000, 'aktif', 'Lapangan badminton lantai kayu parquet klasik dengan sirkulasi udara optimal.', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80')
ON CONFLICT DO NOTHING;
