import React, { useState, useEffect } from 'react';
import { supabase, isConfigured, getLocalData } from '../../lib/supabase';
import { LayoutDashboard, TrendingUp, Calendar, CheckCircle2, AlertCircle, DollarSign, Activity, Users } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalReservasi: 0,
    totalPendapatan: 0,
    okupansi: []
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data } = await supabase.rpc('get_dashboard_stats', {
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });
      if (data) {
        setStats({
          totalReservasi: data.total_reservasi || 0,
          totalPendapatan: data.total_pendapatan || 0,
          okupansi: data.okupansi_lapangan || []
        });
      }
    } else {
      // Hitung statistik dari Local Storage Demo Data
      const resv = getLocalData('reservasi', []);
      const laps = getLocalData('lapangan', []);

      const filtered = resv.filter(r => {
        if (r.status === 'dibatalkan') return false;
        if (startDate && r.tanggal < startDate) return false;
        if (endDate && r.tanggal > endDate) return false;
        return true;
      });

      const trxs = getLocalData('transaksi', []);

      const totalRes = filtered.length;
      
      // Hitung total pendapatan dari tabel transaksi yang berhasil
      const totalRev = trxs
        .filter(t => t.status === 'berhasil')
        .reduce((sum, t) => sum + (t.jumlah_bayar || 0), 0);

      const okMap = laps.map(l => {
        const bookings = filtered.filter(r => r.id_lapangan === l.id);
        const bookingIds = bookings.map(r => r.id_reservasi);

        const jamTerpakai = bookings.reduce((sum, r) => {
          const s = parseInt(r.jam_mulai.split(':')[0], 10);
          const e = parseInt(r.jam_selesai.split(':')[0], 10);
          return sum + (e - s);
        }, 0);

        // Pendapatan lapangan dari transaksi yang terhubung dengan reservasi lapangan ini
        const revLap = trxs
          .filter(t => t.status === 'berhasil' && bookingIds.includes(t.id_reservasi))
          .reduce((sum, t) => sum + (t.jumlah_bayar || 0), 0);

        return {
          id: l.id,
          nama_lapangan: l.nama_lapangan,
          jenis: l.jenis,
          total_booking: bookings.length,
          total_jam_terpakai: jamTerpakai,
          pendapatan_lapangan: revLap
        };
      });

      setStats({
        totalReservasi: totalRes,
        totalPendapatan: totalRev,
        okupansi: okMap
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase">
            EXECUTIVE OVERVIEW
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Dashboard Statistik & Okupansi
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Pantau kinerja reservasi, total pendapatan, dan pemanfaatan lapangan secara real-time
          </p>
        </div>

        {/* Filter Tanggal */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-[#e2e8f0] shadow-xs">
          <div className="flex items-center gap-2 px-2 text-xs text-[#374151]">
            <Calendar className="w-3.5 h-3.5 text-[#145aff]" />
            <span>Periode:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs bg-[#f1f5f9] px-2.5 py-1.5 rounded-lg border border-[#e2e8f0]"
          />
          <span className="text-xs text-[#6b7280]">–</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs bg-[#f1f5f9] px-2.5 py-1.5 rounded-lg border border-[#e2e8f0]"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-[#f26052] hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (Relate SaaS Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Reservasi */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 shadow-xs relative overflow-hidden group hover:border-[#145aff]/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
              TOTAL RESERVASI AKTIF
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-semibold text-[#020520] tracking-tight">
            {stats.totalReservasi} <span className="text-base font-normal text-[#6b7280]">Pemesanan</span>
          </div>
          <div className="mt-3 text-xs text-[#16ca2e] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tidak termasuk transaksi yang dibatalkan</span>
          </div>
        </div>

        {/* Card 2: Total Pendapatan */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 shadow-xs relative overflow-hidden group hover:border-[#145aff]/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
              TOTAL PENDAPATAN (LUNAS)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-mono font-bold text-[#145aff] tracking-tight">
            Rp {stats.totalPendapatan.toLocaleString('id-ID')}
          </div>
          <div className="mt-3 text-xs text-[#6b7280]">
            Dari reservasi berstatus Dikonfirmasi & Selesai
          </div>
        </div>

        {/* Card 3: Total Lapangan Operasional */}
        <div className="bg-white rounded-[24px] border border-[#e2e8f0] p-6 shadow-xs relative overflow-hidden group hover:border-[#145aff]/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
              LAPANGAN OPERASIONAL
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-semibold text-[#020520] tracking-tight">
            {stats.okupansi.length} <span className="text-base font-normal text-[#6b7280]">Lapangan</span>
          </div>
          <div className="mt-3 text-xs text-[#374151]">
            2 Lapangan Futsal + 3 Lapangan Badminton
          </div>
        </div>
      </div>

      {/* Rincian Okupansi per Lapangan */}
      <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[#020520]">
              Laporan Okupansi per Lapangan
            </h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Rincian jam pemakaian dan kontribusi pendapatan dari tiap fasilitas
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <th className="py-3 px-4">Nama Lapangan</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4 text-center">Total Booking</th>
                <th className="py-3 px-4 text-center">Total Jam Terpakai</th>
                <th className="py-3 px-4 text-right">Pendapatan Lapangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-sm">
              {stats.okupansi.map((item) => (
                <tr key={item.id} className="hover:bg-[#f0f4fe]/40 transition-colors">
                  <td className="py-4 px-4 font-semibold text-[#020520]">
                    {item.nama_lapangan}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-[#f0f4fe] text-[#145aff]">
                      {item.jenis}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-medium text-[#14141e]">
                    {item.total_booking} Kali
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-medium text-[#14141e]">
                    {item.total_jam_terpakai} Jam
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-[#145aff]">
                    Rp {item.pendapatan_lapangan.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
