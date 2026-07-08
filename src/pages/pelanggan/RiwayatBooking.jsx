import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isConfigured, getLocalData, setLocalData } from '../../lib/supabase';
import StatusBadge from '../../components/StatusBadge';
import ReceiptModal from '../../components/ReceiptModal';
import PaymentConfirmModal from '../../components/PaymentConfirmModal';
import { CreditCard, Search, XCircle, CheckCircle2, Calendar, Clock, FileText } from 'lucide-react';

export default function RiwayatBooking() {
  const { user, profile } = useAuth();
  const [reservasiList, setReservasiList] = useState([]);
  const [lapanganMap, setLapanganMap] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(null);

  // State untuk Konfirmasi Pembayaran & Struk
  const [selectedForPayment, setSelectedForPayment] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data: resData } = await supabase
        .from('reservasi')
        .select('*, lapangan(nama_lapangan, jenis)')
        .eq('id_pelanggan', user.id)
        .order('tanggal', { ascending: false });

      const { data: lapData } = await supabase.from('lapangan').select('*');
      const lMap = {};
      (lapData || []).forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);
      setReservasiList(resData || []);
    } else {
      const laps = getLocalData('lapangan', []);
      const lMap = {};
      laps.forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);

      const allRes = getLocalData('reservasi', []);
      const myRes = allRes.filter(r => r.id_pelanggan === user?.id);
      setReservasiList(myRes);
    }
    setLoading(false);
  };

  // Langkah 1: Klik "Bayar Sekarang" -> Buka Konfirmasi Pembayaran
  const handleOpenConfirmPayment = (resItem) => {
    const lap = lapanganMap[resItem.id_lapangan];
    const itemWithLap = {
      ...resItem,
      lapangan: lap || { nama_lapangan: `Lapangan #${resItem.id_lapangan}`, jenis: 'olahraga' }
    };
    setSelectedForPayment(itemWithLap);
    setIsConfirmOpen(true);
  };

  // Langkah 2: Pelanggan mengonfirmasi bayar -> Simulasikan lunas -> Catat Transaksi & Munculkan Struk
  const handleConfirmPay = async (resItem) => {
    setIsProcessingPay(true);
    const idReservasi = resItem.id_reservasi;

    const dataTransaksiBaru = {
      id_reservasi: idReservasi,
      id_pelanggan: user.id,
      kode_transaksi: resItem.id_transaksi,
      jumlah_bayar: resItem.total_bayar,
      metode_bayar: 'QRIS / Virtual Account (Simulasi)',
      status: 'berhasil',
      waktu_bayar: new Date().toISOString()
    };

    if (isConfigured && supabase) {
      // Catat ke tabel transaksi & update reservasi (trigger database juga akan menyinkronkan status)
      await supabase.from('transaksi').insert([dataTransaksiBaru]);
      await supabase
        .from('reservasi')
        .update({ status: 'dikonfirmasi' })
        .eq('id_reservasi', idReservasi);
    } else {
      const allRes = getLocalData('reservasi', []);
      const updated = allRes.map((r) => 
        r.id_reservasi === idReservasi ? { ...r, status: 'dikonfirmasi' } : r
      );
      setLocalData('reservasi', updated);

      const allTrx = getLocalData('transaksi', []);
      const baruTrx = {
        id_transaksi: `trx-${Date.now()}`,
        ...dataTransaksiBaru
      };
      setLocalData('transaksi', [baruTrx, ...allTrx]);
    }

    const lap = lapanganMap[resItem.id_lapangan];
    const updatedReservasi = {
      ...resItem,
      status: 'dikonfirmasi',
      lapangan: lap || { nama_lapangan: `Lapangan #${resItem.id_lapangan}`, jenis: 'olahraga' }
    };

    setIsProcessingPay(false);
    setIsConfirmOpen(false);

    setNotif({
      type: 'success',
      text: 'Pembayaran berhasil dikonfirmasi! Berikut adalah struk resmi pesanan Anda.'
    });

    // Langsung buka modal struk LUNAS
    setSelectedReceipt(updatedReservasi);
    setIsReceiptOpen(true);

    fetchData();
    setTimeout(() => setNotif(null), 4500);
  };

  // Handler Lihat Struk manual kapan saja
  const handleLihatStruk = (resItem) => {
    const lap = lapanganMap[resItem.id_lapangan];
    const itemWithLap = {
      ...resItem,
      lapangan: lap || { nama_lapangan: `Lapangan #${resItem.id_lapangan}`, jenis: 'olahraga' }
    };
    setSelectedReceipt(itemWithLap);
    setIsReceiptOpen(true);
  };

  // Handler Batalkan Reservasi
  const handleBatalkan = async (idReservasi) => {
    if (!window.confirm('Yakin ingin membatalkan reservasi ini? Slot akan dikembalikan sebagai Tersedia.')) return;

    if (isConfigured && supabase) {
      await supabase
        .from('reservasi')
        .update({ status: 'dibatalkan' })
        .eq('id_reservasi', idReservasi);
    } else {
      const allRes = getLocalData('reservasi', []);
      const updated = allRes.map((r) => 
        r.id_reservasi === idReservasi ? { ...r, status: 'dibatalkan' } : r
      );
      setLocalData('reservasi', updated);
    }

    setNotif({
      type: 'info',
      text: 'Reservasi telah dibatalkan.'
    });
    fetchData();
    setTimeout(() => setNotif(null), 4000);
  };

  const filteredReservasi = reservasiList.filter((r) => {
    const lap = lapanganMap[r.id_lapangan];
    const namaLap = lap?.nama_lapangan || '';
    const matchSearch = namaLap.toLowerCase().includes(search.toLowerCase()) ||
                        (r.id_transaksi || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'semua' ? true : r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase">
            PELANGGAN PORTAL
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Booking & Riwayat Reservasi Saya
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Klik Bayar Sekarang untuk konfirmasi pesanan dan menerbitkan struk lunas
          </p>
        </div>

        {/* Search Bar & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama lapangan / TRX..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-[#e2e8f0] text-xs w-64 focus:outline-none focus:border-[#145aff]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#e2e8f0] text-xs font-medium text-[#374151]"
          >
            <option value="semua">Semua Status</option>
            <option value="pending">Menunggu Pembayaran</option>
            <option value="dikonfirmasi">Dikonfirmasi (Lunas)</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {notif && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
          notif.type === 'success'
            ? 'bg-[#f0fdf4] border border-[#16ca2e] text-[#15803d]'
            : 'bg-[#f0f4fe] border border-[#145aff] text-[#145aff]'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notif.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-[#6b7280]">Memuat riwayat booking Anda...</div>
      ) : filteredReservasi.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-12 text-center">
          <Calendar className="w-12 h-12 text-[#9ca3af] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[#020520]">Belum Ada Reservasi</h3>
          <p className="text-xs text-[#6b7280] mt-1">
            Anda belum memiliki reservasi lapangan dengan kriteria ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservasi.map((res) => {
            const lap = lapanganMap[res.id_lapangan];
            const isPending = res.status === 'pending';
            const isLunas = res.status === 'dikonfirmasi' || res.status === 'selesai';

            return (
              <div
                key={res.id_reservasi}
                className="bg-white rounded-[20px] border border-[#e2e8f0] p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Kiri: Info Lapangan & Waktu */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#f0f4fe] text-[#145aff]">
                      {lap?.jenis || 'Olahraga'}
                    </span>
                    <span className="text-xs font-mono text-[#6b7280]">{res.id_transaksi}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#020520]">
                    {lap?.nama_lapangan || `Lapangan #${res.id_lapangan}`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#6b7280]">
                    <span className="flex items-center gap-1.5 font-medium text-[#14141e]">
                      <Calendar className="w-3.5 h-3.5 text-[#145aff]" />
                      {res.tanggal}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#145aff]" />
                      {res.jam_mulai} – {res.jam_selesai} WIB
                    </span>
                    {res.catatan && (
                      <span className="italic text-[#6b7280]">"{res.catatan}"</span>
                    )}
                  </div>
                </div>

                {/* Kanan: Total Harga & Aksi */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:border-l md:border-[#e2e8f0] md:pl-6">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#6b7280]">Total Pembayaran</span>
                    <span className="text-base font-mono font-bold text-[#020520]">
                      Rp {res.total_bayar.toLocaleString('id-ID')}
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={res.status} />
                    </div>
                  </div>

                  {/* Tombol Aksi Pelanggan */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => handleOpenConfirmPayment(res)}
                        className="px-4 py-2.5 rounded-full bg-[#145aff] text-white text-xs font-medium hover:bg-[#0042e6] transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang</span>
                      </button>
                    )}

                    {isLunas && (
                      <button
                        onClick={() => handleLihatStruk(res)}
                        className="px-4 py-2.5 rounded-full bg-[#f0f4fe] border border-[#145aff]/30 text-[#145aff] text-xs font-medium hover:bg-[#145aff] hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Struk</span>
                      </button>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleBatalkan(res.id_reservasi)}
                        title="Batalkan Booking"
                        className="p-2.5 rounded-full border border-[#e2e8f0] text-[#6b7280] hover:text-[#f26052] hover:bg-[#fef2f2] transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Konfirmasi Pembayaran & Rincian Pesanan */}
      <PaymentConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmPay}
        reservasi={selectedForPayment}
        profile={profile}
        isProcessing={isProcessingPay}
      />

      {/* Modal 2: Struk Resmi Setelah Bayar / Lihat Struk */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        reservasi={selectedReceipt}
        profile={profile}
      />
    </div>
  );
}
