import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project.supabase.co') &&
  supabaseAnonKey.length > 20;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// LOCAL STORAGE MOCK ENGINE (Agar Prototipe Sempurna Diuji Tanpa Setup DB)
// ====================================================================

const DEMO_LAPANGAN = [
  {
    id: 1,
    nama_lapangan: 'Futsal Arena A (Vinyl Standard Pro)',
    jenis: 'futsal',
    harga_per_jam: 150000,
    status: 'aktif',
    deskripsi: 'Lantai vinyl standar FIFA dengan lampu LED 800 lux.',
    gambar_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    nama_lapangan: 'Futsal Arena B (Rumput Sintetis Pro)',
    jenis: 'futsal',
    harga_per_jam: 140000,
    status: 'aktif',
    deskripsi: 'Rumput sintetis empuk dan sirkulasi udara nyaman.',
    gambar_url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    nama_lapangan: 'Badminton Court 1 (Karpet Yonex Pro)',
    jenis: 'badminton',
    harga_per_jam: 65000,
    status: 'aktif',
    deskripsi: 'Karpet antislip berstandar turnamen.',
    gambar_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    nama_lapangan: 'Badminton Court 2 (Karpet Yonex Pro)',
    jenis: 'badminton',
    harga_per_jam: 65000,
    status: 'aktif',
    deskripsi: 'Karpet antislip berstandar turnamen.',
    gambar_url: 'https://images.unsplash.com/photo-1613918431703-92f7e02e1c79?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    nama_lapangan: 'Badminton Court 3 (Lantai Kayu Parquet)',
    jenis: 'badminton',
    harga_per_jam: 60000,
    status: 'aktif',
    deskripsi: 'Lantai kayu klasik dengan pantulan shuttlecock optimal.',
    gambar_url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80'
  }
];

const DEMO_USERS = [
  {
    id: 'admin-001',
    nama: 'Budi Santoso (Admin SM Sport)',
    email: 'admin@smsport.com',
    no_hp: '081234567890',
    alamat: 'Jl. Pemuda No. 10, Jakarta',
    role: 'admin'
  },
  {
    id: 'user-001',
    nama: 'Rizky Pratama',
    email: 'rizky@gmail.com',
    no_hp: '085712345678',
    alamat: 'Jl. Sudirman No. 45, Jakarta',
    role: 'pelanggan'
  },
  {
    id: 'user-002',
    nama: 'Nadia Putri',
    email: 'nadia@gmail.com',
    no_hp: '081987654321',
    alamat: 'Jl. Gatot Subroto No. 8, Jakarta',
    role: 'pelanggan'
  }
];

// Helper untuk inisialisasi data local storage
export const getLocalData = (key, defaultData) => {
  const data = localStorage.getItem(`sm_sport_${key}`);
  if (!data) {
    localStorage.setItem(`sm_sport_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultData;
  }
};

export const setLocalData = (key, data) => {
  localStorage.setItem(`sm_sport_${key}`, JSON.stringify(data));
};

// Inisialisasi seed awal jika belum ada data atau perbarui gambar yang kosong
export const initSeedData = () => {
  const currentLap = getLocalData('lapangan', DEMO_LAPANGAN);
  const updatedLap = currentLap.map((l) => {
    if (!l.gambar_url) {
      const demoMatch = DEMO_LAPANGAN.find(d => d.id === l.id);
      return {
        ...l,
        gambar_url: demoMatch ? demoMatch.gambar_url : (
          l.jenis === 'futsal'
            ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
            : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
        )
      };
    }
    return l;
  });
  setLocalData('lapangan', updatedLap);
  getLocalData('users', DEMO_USERS);
  
  const today = new Date().toISOString().split('T')[0];
  const todayStr = today.replace(/-/g, '');

  const defaultReservasi = [
    {
      id_reservasi: 'res-demo-1',
      id_pelanggan: 'user-001',
      id_lapangan: 1,
      tanggal: today,
      jam_mulai: '10:00',
      jam_selesai: '12:00',
      status: 'dikonfirmasi',
      total_bayar: 300000,
      id_transaksi: `TRX-${todayStr}-001`,
      catatan: 'Latihan tim futsal mingguan',
      created_at: new Date().toISOString()
    },
    {
      id_reservasi: 'res-demo-2',
      id_pelanggan: 'user-001',
      id_lapangan: 3,
      tanggal: today,
      jam_mulai: '16:00',
      jam_selesai: '18:00',
      status: 'pending',
      total_bayar: 130000,
      id_transaksi: `TRX-${todayStr}-002`,
      catatan: 'Main ganda putra',
      created_at: new Date().toISOString()
    },
    {
      id_reservasi: 'res-demo-3',
      id_pelanggan: 'user-002',
      id_lapangan: 2,
      tanggal: today,
      jam_mulai: '19:00',
      jam_selesai: '21:00',
      status: 'dikonfirmasi',
      total_bayar: 280000,
      id_transaksi: `TRX-${todayStr}-003`,
      catatan: 'Sparring malam',
      created_at: new Date().toISOString()
    }
  ];
  getLocalData('reservasi', defaultReservasi);

  const defaultTransaksi = [
    {
      id_transaksi: 'trx-demo-1',
      id_reservasi: 'res-demo-1',
      id_pelanggan: 'user-001',
      kode_transaksi: `TRX-${todayStr}-001`,
      jumlah_bayar: 300000,
      metode_bayar: 'QRIS / Virtual Account (Simulasi)',
      status: 'berhasil',
      waktu_bayar: new Date().toISOString()
    },
    {
      id_transaksi: 'trx-demo-2',
      id_reservasi: 'res-demo-3',
      id_pelanggan: 'user-002',
      kode_transaksi: `TRX-${todayStr}-003`,
      jumlah_bayar: 280000,
      metode_bayar: 'QRIS / Virtual Account (Simulasi)',
      status: 'berhasil',
      waktu_bayar: new Date().toISOString()
    }
  ];
  getLocalData('transaksi', defaultTransaksi);
};

initSeedData();
