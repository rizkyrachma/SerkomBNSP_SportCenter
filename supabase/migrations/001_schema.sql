-- =============================================
-- SM Sport Center — Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. TABLES
-- =============================================

-- Profil pengguna, extend dari auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  no_hp TEXT,
  role TEXT NOT NULL CHECK (role IN ('pengguna', 'admin')) DEFAULT 'pengguna',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Master data lapangan
CREATE TABLE IF NOT EXISTS lapangan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('futsal', 'badminton')),
  harga_per_jam NUMERIC NOT NULL,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Slot jadwal per lapangan
CREATE TABLE IF NOT EXISTS jadwal_slot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lapangan_id UUID REFERENCES lapangan(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('kosong', 'dibooking', 'maintenance')) DEFAULT 'kosong',
  UNIQUE (lapangan_id, tanggal, jam_mulai)
);

-- Booking / reservasi
CREATE TABLE IF NOT EXISTS booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  lapangan_id UUID REFERENCES lapangan(id),
  slot_id UUID REFERENCES jadwal_slot(id),
  tanggal DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  status_booking TEXT NOT NULL CHECK (status_booking IN ('menunggu_bayar', 'dp', 'lunas', 'batal')) DEFAULT 'menunggu_bayar',
  total_harga NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transaksi pembayaran
CREATE TABLE IF NOT EXISTS transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES booking(id) ON DELETE CASCADE,
  metode_bayar TEXT NOT NULL,
  jumlah_bayar NUMERIC NOT NULL,
  jenis_bayar TEXT NOT NULL CHECK (jenis_bayar IN ('dp', 'pelunasan')),
  waktu_bayar TIMESTAMPTZ DEFAULT now(),
  dicatat_oleh UUID REFERENCES profiles(id)
);


-- 2. FUNCTIONS & TRIGGERS
-- =============================================

-- Function: auto-update jadwal_slot.status saat booking dibuat
CREATE OR REPLACE FUNCTION fn_booking_update_slot()
RETURNS TRIGGER AS $$
BEGIN
  -- Saat booking baru dibuat (bukan batal), set slot ke 'dibooking'
  IF TG_OP = 'INSERT' AND NEW.status_booking != 'batal' THEN
    UPDATE jadwal_slot SET status = 'dibooking' WHERE id = NEW.slot_id;
  END IF;

  -- Saat status booking diupdate
  IF TG_OP = 'UPDATE' THEN
    -- Jika dibatalkan, kembalikan slot ke 'kosong'
    IF NEW.status_booking = 'batal' AND OLD.status_booking != 'batal' THEN
      UPDATE jadwal_slot SET status = 'kosong' WHERE id = NEW.slot_id;
    END IF;
    -- Jika status berubah dari batal ke aktif (unlikely but safe)
    IF OLD.status_booking = 'batal' AND NEW.status_booking != 'batal' THEN
      UPDATE jadwal_slot SET status = 'dibooking' WHERE id = NEW.slot_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pada tabel booking
DROP TRIGGER IF EXISTS trg_booking_update_slot ON booking;
CREATE TRIGGER trg_booking_update_slot
  AFTER INSERT OR UPDATE ON booking
  FOR EACH ROW
  EXECUTE FUNCTION fn_booking_update_slot();

-- Function: auto-create profile setelah signup
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nama_lengkap, no_hp, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'no_hp', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'pengguna')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pada auth.users
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION fn_handle_new_user();

-- Function: generate slot harian untuk semua lapangan aktif
CREATE OR REPLACE FUNCTION fn_generate_daily_slots(target_date DATE)
RETURNS VOID AS $$
DECLARE
  lap RECORD;
  jam INT;
BEGIN
  FOR lap IN SELECT id FROM lapangan WHERE status_aktif = true LOOP
    FOR jam IN 8..22 LOOP
      INSERT INTO jadwal_slot (lapangan_id, tanggal, jam_mulai, jam_selesai, status)
      VALUES (
        lap.id,
        target_date,
        make_time(jam, 0, 0),
        make_time(jam + 1, 0, 0),
        'kosong'
      )
      ON CONFLICT (lapangan_id, tanggal, jam_mulai) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lapangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Lapangan policies (semua bisa lihat, admin bisa CRUD)
CREATE POLICY "Anyone can view lapangan"
  ON lapangan FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert lapangan"
  ON lapangan FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update lapangan"
  ON lapangan FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete lapangan"
  ON lapangan FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Jadwal slot policies
CREATE POLICY "Anyone can view jadwal_slot"
  ON jadwal_slot FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert jadwal_slot"
  ON jadwal_slot FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update jadwal_slot"
  ON jadwal_slot FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow the trigger function to update jadwal_slot
-- (SECURITY DEFINER on the function handles this)

-- Booking policies
CREATE POLICY "Users can view own bookings"
  ON booking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON booking FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create own bookings"
  ON booking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON booking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all bookings"
  ON booking FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Transaksi policies
CREATE POLICY "Users can view own transaksi"
  ON transaksi FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM booking WHERE booking.id = transaksi.booking_id AND booking.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all transaksi"
  ON transaksi FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert transaksi"
  ON transaksi FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- 4. ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE jadwal_slot;


-- 5. SEED DATA — Lapangan
-- =============================================
INSERT INTO lapangan (nama, jenis, harga_per_jam, status_aktif) VALUES
  ('Futsal Lapangan 1', 'futsal', 150000, true),
  ('Futsal Lapangan 2', 'futsal', 150000, true),
  ('Badminton Court 1', 'badminton', 75000, true),
  ('Badminton Court 2', 'badminton', 75000, true),
  ('Badminton Court 3', 'badminton', 80000, true);

-- Generate slots untuk 7 hari ke depan
SELECT fn_generate_daily_slots(CURRENT_DATE + i) FROM generate_series(0, 6) AS i;


-- 6. SEED DATA — Akun Admin & Pengguna (Tanpa Email Rate Limit)
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  user_id uuid := gen_random_uuid();
BEGIN
  -- Hapus user lama jika ada
  DELETE FROM auth.users WHERE email IN ('admin@smsport.com', 'user@smsport.com');

  -- 1. Buat Akun Admin
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@smsport.com', crypt('admin123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama_lengkap":"Administrator SM","role":"admin"}', now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), admin_id, admin_id::text,
    format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@smsport.com')::jsonb,
    'email', now(), now(), now()
  );

  UPDATE public.profiles SET role = 'admin' WHERE id = admin_id;

  -- 2. Buat Akun Pengguna Biasa
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'user@smsport.com', crypt('user123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"nama_lengkap":"Budi Pengguna","no_hp":"081234567890","role":"pengguna"}', now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), user_id, user_id::text,
    format('{"sub":"%s","email":"%s"}', user_id::text, 'user@smsport.com')::jsonb,
    'email', now(), now(), now()
  );
END $$;

