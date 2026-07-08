import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isConfigured, getLocalData } from '../../lib/supabase';
import { Calendar as CalendarIcon, ArrowRight, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OPERATIONAL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
  '20:00', '21:00', '22:00'
];

export default function JadwalBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterJenis, setFilterJenis] = useState('semua');
  const [lapanganList, setLapanganList] = useState([]);
  const [reservasiList, setReservasiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [tanggal]);

  const fetchData = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data: laps } = await supabase.from('lapangan').select('*').eq('status', 'aktif').order('id');
      const { data: resv } = await supabase
        .from('reservasi')
        .select('*')
        .eq('tanggal', tanggal)
        .neq('status', 'dibatalkan');

      setLapanganList(laps || []);
      setReservasiList(resv || []);
    } else {
      const laps = getLocalData('lapangan', []).filter(l => l.status === 'aktif');
      const resv = getLocalData('reservasi', []).filter(
        r => r.tanggal === tanggal && r.status !== 'dibatalkan'
      );
      setLapanganList(laps);
      setReservasiList(resv);
    }
    setLoading(false);
  };

  const getBookedSlotCount = (idLapangan) => {
    return reservasiList.filter(r => r.id_lapangan.toString() === idLapangan.toString()).length;
  };

  const filteredLapangan = lapanganList.filter((l) => 
    filterJenis === 'semua' ? true : l.jenis?.toLowerCase() === filterJenis
  );

  const futsalList = filteredLapangan.filter((l) => l.jenis?.toLowerCase() === 'futsal');
  const badmintonList = filteredLapangan.filter((l) => l.jenis?.toLowerCase() === 'badminton');

  const handleCardClick = (lap) => {
    navigate(`/pelanggan/pesan/${lap.id}?tanggal=${tanggal}`);
  };

  const renderCourtCard = (lap, accentType) => {
    const isFutsal = accentType === 'futsal';
    const bookedCount = getBookedSlotCount(lap.id);
    const totalSlots = OPERATIONAL_HOURS.length;
    const availableSlots = Math.max(0, totalSlots - bookedCount);

    return (
      <div
        key={lap.id}
        onClick={() => handleCardClick(lap)}
        className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden hover:border-[#145aff] hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
      >
        {/* Banner Foto Lapangan */}
        <div>
          <div className="relative h-52 w-full overflow-hidden bg-[#f1f5f9]">
            <img
              src={lap.gambar_url || (isFutsal
                ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
                : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80')}
              alt={lap.nama_lapangan}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {/* Badge Kategori Kiri Atas */}
            <div className="absolute top-4 left-4">
              <span className={`inline-block text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full text-white shadow-sm ${
                isFutsal ? 'bg-[#145aff]' : 'bg-[#15803d]'
              }`}>
                {isFutsal ? '⚽ FUTSAL' : '🏸 BADMINTON'}
              </span>
            </div>

            {/* Ketersediaan Slot Kanan Atas */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-[#020520] shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#145aff]" />
                <span>{availableSlots} Slot Jam Tersedia</span>
              </span>
            </div>

            {/* Harga di Bawah Foto */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
              <span className="text-xl font-mono font-bold">
                Rp {lap.harga_per_jam.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-white/80"> / jam</span>
              </span>
            </div>
          </div>

          {/* Info Lapangan */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-[#020520] group-hover:text-[#145aff] transition-colors">
              {lap.nama_lapangan}
            </h3>
            <p className="text-xs text-[#6b7280] mt-1.5 line-clamp-2 leading-relaxed">
              {lap.deskripsi || (isFutsal
                ? 'Lantai Vinyl berstandar internasional, pencahayaan LED terang, dan sirkulasi udara optimal.'
                : 'Karpet Yonex tebal anti-slip, pencahayaan bebas silau untuk kenyamanan bermain maksimal.')}
            </p>
          </div>
        </div>

        {/* Footer Tombol Action */}
        <div className="px-6 pb-6 pt-2">
          <button
            type="button"
            className={`w-full py-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
              isFutsal
                ? 'bg-[#f0f4fe] text-[#145aff] group-hover:bg-[#145aff] group-hover:text-white'
                : 'bg-[#f0fdf4] text-[#15803d] group-hover:bg-[#15803d] group-hover:text-white'
            }`}
          >
            <span>Pesan & Reservasi Lapangan Ini</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Page Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PILIH LAPANGAN OLAHRAGA</span>
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Jadwal & Ketersediaan Lapangan
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Klik kartu lapangan di bawah untuk memilih jam dan melanjutkan ke halaman pemesanan
          </p>
        </div>

        {/* Filter Tanggal & Jenis Lapangan */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e2e8f0] shadow-xs">
            <CalendarIcon className="w-4 h-4 text-[#145aff]" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="text-xs font-semibold text-[#14141e] bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-xl bg-[#f1f5f9] p-1 border border-[#e2e8f0]">
            <button
              onClick={() => setFilterJenis('semua')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterJenis === 'semua' ? 'bg-white text-[#145aff] shadow-xs' : 'text-[#6b7280] hover:text-[#020520]'
              }`}
            >
              Semua Lapangan ({lapanganList.length})
            </button>
            <button
              onClick={() => setFilterJenis('futsal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterJenis === 'futsal' ? 'bg-white text-[#145aff] shadow-xs' : 'text-[#6b7280] hover:text-[#020520]'
              }`}
            >
              <span>⚽</span>
              <span>Khusus Futsal</span>
            </button>
            <button
              onClick={() => setFilterJenis('badminton')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterJenis === 'badminton' ? 'bg-white text-[#15803d] shadow-xs' : 'text-[#6b7280] hover:text-[#020520]'
              }`}
            >
              <span>🏸</span>
              <span>Khusus Badminton</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-16 text-center text-sm text-[#6b7280] shadow-sm">
          Memuat daftar lapangan...
        </div>
      ) : (
        <div className="space-y-10">
          {/* SEKSI 1: FUTSAL */}
          {(filterJenis === 'semua' || filterJenis === 'futsal') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#f0f4fe] flex items-center justify-center text-sm">
                    ⚽
                  </div>
                  <h2 className="text-lg font-bold text-[#020520] tracking-tight">
                    Kategori Lapangan Futsal ({futsalList.length})
                  </h2>
                </div>
                <span className="text-xs text-[#6b7280] hidden sm:block">
                  Lantai Vinyl Pro & Rumput Sintetis • Klik kartu untuk pesan
                </span>
              </div>

              {futsalList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6b7280] bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                  Tidak ada lapangan futsal yang aktif saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {futsalList.map((lap) => renderCourtCard(lap, 'futsal'))}
                </div>
              )}
            </div>
          )}

          {/* SEKSI 2: BADMINTON */}
          {(filterJenis === 'semua' || filterJenis === 'badminton') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] flex items-center justify-center text-sm">
                    🏸
                  </div>
                  <h2 className="text-lg font-bold text-[#020520] tracking-tight">
                    Kategori Lapangan Badminton ({badmintonList.length})
                  </h2>
                </div>
                <span className="text-xs text-[#6b7280] hidden sm:block">
                  Karpet Yonex & Lantai Kayu Parquet • Klik kartu untuk pesan
                </span>
              </div>

              {badmintonList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6b7280] bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                  Tidak ada lapangan badminton yang aktif saat ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badmintonList.map((lap) => renderCourtCard(lap, 'badminton'))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
