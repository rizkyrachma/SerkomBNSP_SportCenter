import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { FileDown, Filter, Calendar } from 'lucide-react';

export default function LaporanTransaksi() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [bulan, setBulan] = useState(String(currentMonth).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(currentYear));
  const [transaksis, setTransaksis] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Aggregate stats
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [totalBooking, setTotalBooking] = useState(0);
  const [bookingSukses, setBookingSukses] = useState(0);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const startDate = `${tahun}-${bulan}-01T00:00:00.000Z`;
      const lastDay = new Date(Number(tahun), Number(bulan), 0).getDate();
      const endDate = `${tahun}-${bulan}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('transaksi')
        .select('*, reservasi(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const txList = data || [];
      setTransaksis(txList);

      let pendapatanSum = 0;
      let suksesCount = 0;

      txList.forEach((tx) => {
        if (tx.status_verifikasi === 'disetujui') {
          pendapatanSum += Number(tx.jumlah_bayar);
          suksesCount++;
        }
      });

      setTotalPendapatan(pendapatanSum);
      setTotalBooking(txList.length);
      setBookingSukses(suksesCount);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat laporan transaksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [bulan, tahun]);

  const handleExportExcel = () => {
    if (transaksis.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    try {
      const excelData = transaksis.map((tx, index) => {
        const res = tx.reservasi || {};
        return {
          'No': index + 1,
          'ID Transaksi': tx.id.toUpperCase(),
          'ID Reservasi': res.id ? res.id.toUpperCase() : '-',
          'Nama Pelanggan': res.pelanggan?.nama || 'Pelanggan',
          'Email Pelanggan': res.pelanggan?.email || '-',
          'Nomor Telepon': res.pelanggan?.no_telepon || '-',
          'Lapangan': res.lapangan?.nama || '-',
          'Jenis': res.lapangan?.jenis || '-',
          'Tanggal Booking': res.tanggal || '-',
          'Jam Mulai': res.jam_mulai ? res.jam_mulai.substring(0, 5) : '-',
          'Jam Selesai': res.jam_selesai ? res.jam_selesai.substring(0, 5) : '-',
          'Tarif Dasar (Rp)': Number(res.total_harga || 0),
          'Kode Unik (Rp)': tx.kode_unik,
          'Total Dibayar (Rp)': Number(tx.jumlah_bayar),
          'Metode Pembayaran': tx.metode_pembayaran === 'qris_statis' ? 'QRIS' : 'Transfer Bank',
          'Status Verifikasi': tx.status_verifikasi === 'disetujui' ? 'Disetujui (Lunas)' : tx.status_verifikasi === 'ditolak' ? 'Ditolak' : 'Menunggu',
          'Waktu Verifikasi': tx.diverifikasi_pada ? new Date(tx.diverifikasi_pada).toLocaleString('id-ID') : '-'
        };
      });

      excelData.push({});
      excelData.push({
        'No': 'RINGKASAN LAPORAN',
        'ID Transaksi': `Bulan: ${bulan} / Tahun: ${tahun}`
      });
      excelData.push({
        'No': 'Total Seluruh Reservasi',
        'ID Transaksi': totalBooking
      });
      excelData.push({
        'No': 'Jumlah Reservasi Sukses (Lunas)',
        'ID Transaksi': bookingSukses
      });
      excelData.push({
        'No': 'Total Pendapatan Bersih (Rp)',
        'ID Transaksi': totalPendapatan
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan_${bulan}_${tahun}`);

      const maxColLengths = {};
      excelData.forEach(row => {
        Object.keys(row).forEach(key => {
          const val = String(row[key] || '');
          maxColLengths[key] = Math.max(maxColLengths[key] || 10, val.length + 3);
        });
      });
      worksheet['!cols'] = Object.keys(maxColLengths).map(key => ({
        wch: maxColLengths[key]
      }));

      XLSX.writeFile(workbook, `Laporan_Transaksi_SM_Sport_${bulan}_${tahun}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor laporan ke Excel.');
    }
  };

  const monthNames = [
    { value: '01', name: 'Januari' },
    { value: '02', name: 'Februari' },
    { value: '03', name: 'Maret' },
    { value: '04', name: 'April' },
    { value: '05', name: 'Mei' },
    { value: '06', name: 'Juni' },
    { value: '07', name: 'Juli' },
    { value: '08', name: 'Agustus' },
    { value: '09', name: 'September' },
    { value: '10', name: 'Oktober' },
    { value: '11', name: 'November' },
    { value: '12', name: 'Desember' }
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Keuangan & Statistik</span>
          <h2 className="font-cal-sans text-heading font-semibold text-graphite">Laporan Reservasi</h2>
          <p className="text-body-sm text-slate font-medium">
            Filter riwayat transaksi bulanan dan ekspor ke format Excel.
          </p>
        </div>

        {/* Date Filters & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-silver rounded-inputs px-3 py-1.5 text-body-sm shadow-sm font-semibold">
            <Filter className="w-4 h-4 text-slate" />
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="bg-transparent text-graphite focus:outline-none cursor-pointer font-semibold"
            >
              {monthNames.map(m => (
                <option key={m.value} value={m.value} className="bg-white">{m.name}</option>
              ))}
            </select>
            <span className="text-silver">|</span>
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="bg-transparent text-graphite focus:outline-none cursor-pointer font-semibold"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-white">{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileDown className="w-4 h-4 text-action-blue" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-cards p-6 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Pendapatan Bersih (Lunas)</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-cal-sans font-bold text-subheading text-action-blue">
              Rp {totalPendapatan.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-cards p-6 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Total Reservasi Masuk</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-cal-sans font-bold text-subheading text-graphite">
              {totalBooking}
            </span>
            <span className="text-xs text-slate font-semibold uppercase">booking</span>
          </div>
        </div>

        <div className="bg-white rounded-cards p-6 border border-silver flex flex-col justify-between shadow-sm">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Rasio Pembayaran</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-cal-sans font-bold text-subheading text-graphite">
              {totalBooking > 0 ? Math.round((bookingSukses / totalBooking) * 100) : 0}%
            </span>
            <span className="text-xs text-slate font-semibold">({bookingSukses} sukses)</span>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-12 h-12 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
        </div>
      ) : transaksis.length === 0 ? (
        <div className="bg-white border border-silver rounded-cards p-12 text-center text-slate font-semibold shadow-sm">
          Tidak ada data transaksi pada periode {monthNames.find(m => m.value === bulan)?.name} {tahun}.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-cards border border-silver shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-silver bg-paper text-slate text-body-sm font-bold">
                <th className="p-4 pl-6">No.</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Lapangan</th>
                <th className="p-4">Tanggal & Jam Sewa</th>
                <th className="p-4">Jumlah Bayar</th>
                <th className="p-4">Metode</th>
                <th className="p-4 pr-6">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver text-body-sm font-medium text-graphite">
              {transaksis.map((tx, index) => {
                const res = tx.reservasi;
                if (!res) return null;

                return (
                  <tr key={tx.id} className="hover:bg-paper/40 transition-colors">
                    <td className="p-4 pl-6 font-mono text-slate">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-graphite">{res.pelanggan?.nama || 'Pelanggan'}</span>
                        <span className="text-slate text-xs">{res.pelanggan?.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-graphite font-bold">{res.lapangan?.nama}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-graphite font-semibold">{res.tanggal}</span>
                        <span className="text-slate text-xs">
                          {res.jam_mulai.substring(0, 5)} - {res.jam_selesai.substring(0, 5)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-ink">
                      Rp {Number(tx.jumlah_bayar).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-slate capitalize">
                      {tx.metode_pembayaran === 'qris_statis' ? 'QRIS' : 'Transfer Bank'}
                    </td>
                    <td className="p-4 pr-6">
                      <span
                        className={`inline-block px-3 py-1 text-[9px] font-bold uppercase rounded-tags tracking-wider ${
                          tx.status_verifikasi === 'disetujui'
                            ? 'bg-info-banner-bg text-action-blue border border-blue-200'
                            : tx.status_verifikasi === 'ditolak'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {tx.status_verifikasi === 'disetujui' ? 'Disetujui' : tx.status_verifikasi === 'ditolak' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
