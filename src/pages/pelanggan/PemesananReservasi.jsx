import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isConfigured } from '../../lib/supabase';
import { getLocalData, setLocalData } from '../../lib/supabase';
import { Calendar as CalendarIcon, Clock, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign, Info } from 'lucide-react';

const OPERATIONAL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function PemesananReservasi() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialTanggal = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];

  const { user } = useAuth();
  const navigate = useNavigate();

  const [lapangan, setLapangan] = useState(null);
  const [tanggal, setTanggal] = useState(initialTanggal);
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('09:00');
  const [catatan, setCatatan] = useState('');
  const [reservasiList, setReservasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBooking, setErrorBooking] = useState('');
  const [successBooking, setSuccessBooking] = useState('');

  useEffect(() => {
    fetchData();
  }, [id, tanggal]);

  const fetchData = async () => {
    setLoading(true);
    setErrorBooking('');
    if (isConfigured && supabase) {
      try {
        const { data: lapData, error: lapErr } = await supabase
          .from('lapangan')
          .select('*')
          .eq('id', id)
          .single();

        if (lapErr) throw lapErr;
        setLapangan(lapData);

        const { data: resData, error: resErr } = await supabase
          .from('reservasi')
          .select('*')
          .eq('id_lapangan', id)
          .eq('tanggal', tanggal)
          .neq('status', 'dibatalkan');

        if (resErr) throw resErr;
        setReservasiList(resData || []);
      } catch (err) {
        console.error('Error fetching data supabase:', err);
      }
    } else {
      const allLaps = getLocalData('lapangan', []);
      const foundLap = allLaps.find(l => l.id.toString() === id.toString());
      setLapangan(foundLap || null);

      const allResv = getLocalData('reservasi', []).filter(
        r => r.id_lapangan.toString() === id.toString() &&
             r.tanggal === tanggal &&
             r.status !== 'dibatalkan'
      );
      setReservasiList(allResv);
    }
    setLoading(false);
  };

  const isSlotBooked = (jamSlot) => {
    const slotStart = parseInt(jamSlot.split(':')[0], 10);
    return reservasiList.some((r) => {
      const resStart = parseInt(r.jam_mulai.split(':')[0], 10);
      const resEnd = parseInt(r.jam_selesai.split(':')[0], 10);
      return slotStart >= resStart && slotStart < resEnd;
    });
  };

  const durasiJam = Math.max(0, parseInt(jamSelesai.split(':')[0], 10) - parseInt(jamMulai.split(':')[0], 10));
  const totalBiaya = lapangan ? lapangan.harga_per_jam * durasiJam : 0;

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!lapangan) return;
    setErrorBooking('');
    setSuccessBooking('');

    if (durasiJam <= 0) {
      setErrorBooking('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }

    const startNum = parseInt(jamMulai.split(':')[0], 10);
    const endNum = parseInt(jamSelesai.split(':')[0], 10);
    for (let h = startNum; h < endNum; h++) {
      const slotStr = `${h.toString().padStart(2, '0')}:00`;
      if (isSlotBooked(slotStr)) {
        setErrorBooking(`Jam ${slotStr} sudah terisi/booked! Silakan pilih jam lain.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Format ID Transaksi: TRX-(Tanggal YYYYMMDD)-(Urutan Booking Hari Itu)
      const tanggalFormatted = tanggal.replace(/-/g, '');
      let urutanBooking = '001';

      if (isConfigured && supabase) {
        const { data: resTanggal } = await supabase
          .from('reservasi')
          .select('id_reservasi')
          .eq('tanggal', tanggal);
        const countHariIni = resTanggal ? resTanggal.length : 0;
        urutanBooking = (countHariIni + 1).toString().padStart(3, '0');

        const idTransaksiBaru = `TRX-${tanggalFormatted}-${urutanBooking}`;

        const { error } = await supabase.from('reservasi').insert([
          {
            id_pelanggan: user.id,
            id_lapangan: lapangan.id,
            tanggal,
            jam_mulai: jamMulai,
            jam_selesai: jamSelesai,
            status: 'pending',
            total_bayar: totalBiaya,
            id_transaksi: idTransaksiBaru,
            catatan
          }
        ]);
        if (error) throw error;
      } else {
        const currentResv = getLocalData('reservasi', []);
        const isConflict = currentResv.some(r => {
          if (r.id_lapangan.toString() !== lapangan.id.toString() || r.tanggal !== tanggal || r.status === 'dibatalkan') {
            return false;
          }
          const exStart = parseInt(r.jam_mulai.split(':')[0], 10);
          const exEnd = parseInt(r.jam_selesai.split(':')[0], 10);
          return startNum < exEnd && endNum > exStart;
        });

        if (isConflict) {
          throw new Error('Jadwal bentrok dengan reservasi yang sudah ada!');
        }

        const countHariIni = currentResv.filter(r => r.tanggal === tanggal).length;
        urutanBooking = (countHariIni + 1).toString().padStart(3, '0');
        const idTransaksiBaru = `TRX-${tanggalFormatted}-${urutanBooking}`;

        const newRes = {
          id_reservasi: 'res-' + Date.now(),
          id_pelanggan: user.id,
          id_lapangan: lapangan.id,
          tanggal,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
          status: 'pending',
          total_bayar: totalBiaya,
          id_transaksi: idTransaksiBaru,
          catatan,
          created_at: new Date().toISOString()
        };
        setLocalData('reservasi', [newRes, ...currentResv]);
      }

      setSuccessBooking(`Reservasi lapangan ${lapangan.nama_lapangan} berhasil dibuat!`);
      setTimeout(() => {
        navigate('/pelanggan/riwayat');
      }, 1500);
    } catch (err) {
      setErrorBooking(err.message || 'Terjadi kesalahan saat memproses reservasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-16 text-center text-sm text-[#6b7280]">
        Memuat detail lapangan...
      </div>
    );
  }

  if (!lapangan) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#020520] mb-2">Lapangan Tidak Ditemukan</h2>
        <Link
          to="/pelanggan/jadwal"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#145aff] text-white text-xs font-semibold mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Jadwal & Ketersediaan</span>
        </Link>
      </div>
    );
  }

  const isFutsal = lapangan.jenis === 'futsal';

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      {/* Tombol Kembali */}
      <div className="mb-6">
        <Link
          to="/pelanggan/jadwal"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#145aff] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Ketersediaan Lapangan</span>
        </Link>
      </div>

      {/* Header Lapangan */}
      <div className="bg-white rounded-[32px] border border-[#e2e8f0] overflow-hidden shadow-sm mb-8">
        <div className="relative h-64 w-full bg-[#f1f5f9]">
          <img
            src={lapangan.gambar_url || (isFutsal
              ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'
              : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80')}
            alt={lapangan.nama_lapangan}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className={`inline-block text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full text-white mb-2 shadow-sm ${
                isFutsal ? 'bg-[#145aff]' : 'bg-[#15803d]'
              }`}>
                {isFutsal ? '⚽ KATEGORI FUTSAL' : '🏸 KATEGORI BADMINTON'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {lapangan.nama_lapangan}
              </h1>
              <p className="text-xs text-white/80 mt-1 max-w-xl">
                {lapangan.deskripsi || 'Fasilitas berstandar profesional SM Sport Center.'}
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-md">
              <span className="text-[10px] text-[#6b7280] block uppercase tracking-wider font-semibold">Tarif Sewa</span>
              <span className="text-xl font-mono font-bold text-[#145aff]">
                Rp {lapangan.harga_per_jam.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-[#6b7280]">/jam</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Utama Layout Pemesanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kiri (2 Kolom): Pemilihan Tanggal & Slot Jam Operasional */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f0f4fe] flex items-center justify-center text-[#145aff]">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#020520]">Pilih Tanggal Reservasi</h2>
                  <p className="text-xs text-[#6b7280]">Cek ketersediaan jam operasional secara real-time</p>
                </div>
              </div>

              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="px-4 py-2 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm font-semibold text-[#020520] focus:outline-none focus:border-[#145aff]"
              />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#020520] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#145aff]" />
                <span>Grid Jam Operasional (08:00 – 23:00)</span>
              </span>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#f0f4fe] border border-[#145aff]/40"></span>
                  <span className="text-[#374151]">Tersedia</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#fef2f2] border border-[#f87171]"></span>
                  <span className="text-[#6b7280]">Sudah Dipesan</span>
                </span>
              </div>
            </div>

            {/* Grid Tombol Slot Jam */}
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {OPERATIONAL_HOURS.map((jam) => {
                const booked = isSlotBooked(jam);
                const isSelectedStart = jamMulai === jam;
                return (
                  <button
                    type="button"
                    key={jam}
                    disabled={booked}
                    onClick={() => {
                      setJamMulai(jam);
                      const startH = parseInt(jam.split(':')[0], 10);
                      const endH = startH + 1;
                      setJamSelesai(`${endH.toString().padStart(2, '0')}:00`);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      booked
                        ? 'bg-[#fef2f2] text-[#f87171] border border-[#f87171]/30 cursor-not-allowed line-through opacity-70'
                        : isSelectedStart
                          ? 'bg-[#145aff] text-white shadow-sm scale-105'
                          : 'bg-[#f0f4fe] text-[#145aff] border border-[#145aff]/20 hover:bg-[#145aff]/10'
                    }`}
                  >
                    {jam}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#6b7280] mt-4 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#145aff]" />
              Klik salah satu jam tersedia di atas untuk mengatur sebagai Jam Mulai pesanan Anda.
            </p>
          </div>
        </div>

        {/* Kanan (1 Kolom): Form Konfirmasi Pesanan */}
        <div>
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-[#020520] mb-1">
              Rincian Reservasi
            </h2>
            <p className="text-xs text-[#6b7280] mb-6">
              Lengkapi durasi jam dan catatan pesanan
            </p>

            {errorBooking && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#fef2f2] border border-[#f87171] flex items-start gap-2 text-xs text-[#b91c1c]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorBooking}</span>
              </div>
            )}

            {successBooking && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#f0fdf4] border border-[#16ca2e] flex items-start gap-2 text-xs text-[#15803d]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successBooking}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Fasilitas:</span>
                  <span className="font-semibold text-[#020520]">{lapangan.nama_lapangan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Tanggal:</span>
                  <span className="font-semibold text-[#020520]">{tanggal}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">
                    Jam Mulai
                  </label>
                  <select
                    value={jamMulai}
                    onChange={(e) => {
                      setJamMulai(e.target.value);
                      const startH = parseInt(e.target.value.split(':')[0], 10);
                      const endH = parseInt(jamSelesai.split(':')[0], 10);
                      if (endH <= startH) {
                        setJamSelesai(`${(startH + 1).toString().padStart(2, '0')}:00`);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-xs font-mono font-semibold"
                  >
                    {OPERATIONAL_HOURS.map((jam) => (
                      <option key={jam} value={jam}>{jam}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">
                    Jam Selesai
                  </label>
                  <select
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-xs font-mono font-semibold"
                  >
                    {OPERATIONAL_HOURS.map((jam) => {
                      const startH = parseInt(jamMulai.split(':')[0], 10);
                      const optH = parseInt(jam.split(':')[0], 10);
                      if (optH <= startH) return null;
                      return <option key={jam} value={jam}>{jam}</option>;
                    })}
                    <option value="23:00">23:00</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Butuh tambahan rompi / bola"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-xs"
                />
              </div>

              {/* Box Total Tagihan */}
              <div className="p-4 rounded-2xl bg-[#f0f4fe] border border-[#145aff]/30 space-y-1">
                <div className="flex justify-between text-xs text-[#374151]">
                  <span>Durasi Sewa:</span>
                  <span className="font-semibold">{durasiJam} Jam</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#145aff]/20">
                  <span className="text-xs font-bold text-[#020520]">Total Biaya:</span>
                  <span className="text-lg font-mono font-bold text-[#145aff]">
                    Rp {totalBiaya.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || durasiJam <= 0}
                className="w-full py-3.5 rounded-full bg-[#145aff] text-white font-semibold text-xs hover:bg-[#0042e6] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Memproses...' : 'Buat Reservasi Sekarang'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
