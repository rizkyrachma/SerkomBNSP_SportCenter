-- Seeding Data Awal untuk SM Sport Center (Tabel Lapangan)
-- Jalankan script ini di SQL Editor Supabase untuk memasukkan data 5 lapangan ke database Supabase Anda.

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
