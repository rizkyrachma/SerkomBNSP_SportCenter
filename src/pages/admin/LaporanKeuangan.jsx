import React, { useState, useEffect } from 'react';
import { supabase, isConfigured, getLocalData } from '../../lib/supabase';
import ReceiptModal from '../../components/ReceiptModal';
import { DollarSign, Printer, Search, Calendar, CheckCircle2, FileSpreadsheet, TrendingUp, CreditCard, User, Clock } from 'lucide-react';

export default function LaporanKeuangan() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [reservasiMap, setReservasiMap] = useState({});
  const [lapanganMap, setLapanganMap] = useState({});
  const [userMap, setUserMap] = useState({});

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk Struk Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data: trxData } = await supabase
        .from('transaksi')
        .select('*, profiles(nama, email)')
        .order('waktu_bayar', { ascending: false });

      const { data: resData } = await supabase.from('reservasi').select('*');
      const rMap = {};
      (resData || []).forEach(r => { rMap[r.id_reservasi] = r; });
      setReservasiMap(rMap);

      const { data: lapData } = await supabase.from('lapangan').select('*');
      const lMap = {};
      (lapData || []).forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);

      setTransaksiList(trxData || []);
    } else {
      const trxData = getLocalData('transaksi', []);
      const resData = getLocalData('reservasi', []);
      const lapData = getLocalData('lapangan', []);
      const usrData = getLocalData('users', []);

      const rMap = {};
      resData.forEach(r => { rMap[r.id_reservasi] = r; });
      setReservasiMap(rMap);

      const lMap = {};
      lapData.forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);

      const uMap = {};
      usrData.forEach(u => { uMap[u.id] = u; });
      setUserMap(uMap);

      setTransaksiList(trxData);
    }
    setLoading(false);
  };

  const filtered = transaksiList.filter((t) => {
    const res = reservasiMap[t.id_reservasi];
    const usr = userMap[t.id_pelanggan] || t.profiles;
    const lap = res ? lapanganMap[res.id_lapangan] : null;

    const matchSearch =
      (t.kode_transaksi || '').toLowerCase().includes(search.toLowerCase()) ||
      (usr?.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      (usr?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (lap?.nama_lapangan || '').toLowerCase().includes(search.toLowerCase());

    const dateOnly = (t.waktu_bayar || '').split('T')[0];
    const matchStart = startDate ? dateOnly >= startDate : true;
    const matchEnd = endDate ? dateOnly <= endDate : true;

    return matchSearch && matchStart && matchEnd;
  });

  // Hitung KPI ringkasan keuangan berdasarkan filter yang aktif
  const totalPemasukan = filtered
    .filter(t => t.status === 'berhasil')
    .reduce((sum, t) => sum + (t.jumlah_bayar || 0), 0);

  const totalTransaksiBerhasil = filtered.filter(t => t.status === 'berhasil').length;
  const rataRataTransaksi = totalTransaksiBerhasil > 0 ? Math.round(totalPemasukan / totalTransaksiBerhasil) : 0;

  const handleLihatStruk = (trx) => {
    const res = reservasiMap[trx.id_reservasi];
    if (res) {
      const lap = lapanganMap[res.id_lapangan];
      setSelectedReceipt({
        ...res,
        lapangan: lap || { nama_lapangan: `Lapangan #${res.id_lapangan}`, jenis: 'olahraga' }
      });
      setIsReceiptOpen(true);
    }
  };

  const handlePrintLaporan = () => {
    window.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header Halaman (Sembunyi saat print agar fokus ke tabel laporan) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 print:mb-4">
        <div>
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase">
            ADMIN PORTAL — AUDIT & FINANCE
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Laporan Keuangan & Transaksi
          </h1>
          <p className="text-sm text-[#6b7280] mt-1 print:hidden">
            Pantau seluruh arus pembayaran pelanggan dan cetak laporan keuangan resmi SM Sport Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button
            onClick={handlePrintLaporan}
            className="px-5 py-2.5 rounded-full bg-[#145aff] text-white text-xs font-medium hover:bg-[#0042e6] transition-all shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan Keuangan</span>
          </button>
        </div>
      </div>

      {/* Bar Filter Tanggal & Pencarian */}
      <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode transaksi / nama pelanggan / lapangan..."
            className="pl-9 pr-4 py-2 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs w-full focus:outline-none focus:border-[#145aff]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#6b7280]">
            <Calendar className="w-3.5 h-3.5 text-[#145aff]" />
            <span>Periode:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#f8fafc] px-2.5 py-1.5 rounded-xl border border-[#e2e8f0] text-xs"
          />
          <span className="text-[#6b7280]">–</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#f8fafc] px-2.5 py-1.5 rounded-xl border border-[#e2e8f0] text-xs"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-[#f26052] hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Laporan Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              TOTAL PEMASUKAN BERSIH
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-[#145aff] tracking-tight">
            Rp {totalPemasukan.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#16ca2e] font-medium mt-2">
            ● Dari transaksi berstatus Berhasil
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              VOLUME TRANSAKSI
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-semibold text-[#020520] tracking-tight">
            {totalTransaksiBerhasil} <span className="text-base font-normal text-[#6b7280]">Transaksi</span>
          </div>
          <div className="text-xs text-[#6b7280] mt-2">
            Pembayaran tercatat sistem
          </div>
        </div>

        {/* Card 3: Rata-rata Nilai Transaksi */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              RATA-RATA TRANSAKSI
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-mono font-bold text-[#020520] tracking-tight">
            Rp {rataRataTransaksi.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#6b7280] mt-2">
            Per pesanan lapangan
          </div>
        </div>
      </div>

      {/* Tabel Utama Laporan Keuangan */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[#6b7280]">Memuat data laporan keuangan...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-[#9ca3af] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[#020520]">Tidak Ada Transaksi Ditemukan</h3>
          <p className="text-xs text-[#6b7280] mt-1">
            Belum ada catatan transaksi keuangan sesuai kriteria pencarian atau periode tanggal ini.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#fcfcfc]">
            <div>
              <h2 className="text-base font-semibold text-[#020520]">
                Rincian Arus Kas & Transaksi Pembayaran
              </h2>
              <p className="text-xs text-[#6b7280]">
                Menampilkan {filtered.length} transaksi pada laporan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-xs font-semibold text-[#6b7280] uppercase tracking-wider bg-[#f8fafc]">
                  <th className="py-3.5 px-5">Kode TRX & Waktu</th>
                  <th className="py-3.5 px-5">Pelanggan</th>
                  <th className="py-3.5 px-5">Fasilitas & Jadwal</th>
                  <th className="py-3.5 px-5">Metode Bayar</th>
                  <th className="py-3.5 px-5">Nominal Pemasukan</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-sm">
                {filtered.map((trx) => {
                  const res = reservasiMap[trx.id_reservasi];
                  const usr = userMap[trx.id_pelanggan] || trx.profiles;
                  const lap = res ? lapanganMap[res.id_lapangan] : null;

                  const dateStr = new Date(trx.waktu_bayar).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={trx.id_transaksi} className="hover:bg-[#f0f4fe]/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-mono text-xs font-bold text-[#145aff]">
                          {trx.kode_transaksi}
                        </div>
                        <div className="text-xs text-[#6b7280] mt-0.5">{dateStr}</div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#020520] text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#6b7280]" />
                          <span>{usr?.nama || 'Pelanggan'}</span>
                        </div>
                        <div className="text-xs text-[#6b7280]">{usr?.email || ''}</div>
                      </td>

                      <td className="py-4 px-5">
                        {lap ? (
                          <>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#f0f4fe] text-[#145aff]">
                              {lap.jenis}
                            </span>
                            <div className="font-medium text-[#14141e] text-sm mt-1">
                              {lap.nama_lapangan}
                            </div>
                            <div className="text-xs font-mono text-[#6b7280]">
                              {res.tanggal} ({res.jam_mulai}–{res.jam_selesai})
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-[#6b7280]">Data reservasi #{trx.id_reservasi}</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-xs font-medium text-[#374151]">
                        {trx.metode_bayar}
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-[#145aff]">
                        +Rp {trx.jumlah_bayar.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#16ca2e]/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>BERHASIL</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right print:hidden">
                        {res && (
                          <button
                            onClick={() => handleLihatStruk(trx)}
                            className="px-3.5 py-1.5 rounded-full bg-[#f0f4fe] border border-[#145aff]/30 text-[#145aff] text-xs font-medium hover:bg-[#145aff] hover:text-white transition-all inline-flex items-center gap-1.5"
                          >
                            <span>Struk</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Struk Pemesanan */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        reservasi={selectedReceipt}
        profile={userMap[selectedReceipt?.id_pelanggan]}
      />
    </div>
  );
}
