import React, { useState, useEffect } from 'react';
import { supabase, isConfigured, getLocalData, setLocalData } from '../../lib/supabase';
import StatusBadge from '../../components/StatusBadge';
import { Search, Filter, CheckCircle2, Trash2, Calendar, Clock, Edit3, User } from 'lucide-react';

export default function KelolaReservasi() {
  const [reservasiList, setReservasiList] = useState([]);
  const [lapanganMap, setLapanganMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data: resv } = await supabase
        .from('reservasi')
        .select('*, profiles(nama, email, no_hp), lapangan(nama_lapangan, jenis)')
        .order('created_at', { ascending: false });

      const { data: laps } = await supabase.from('lapangan').select('*');
      const lMap = {};
      (laps || []).forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);
      setReservasiList(resv || []);
    } else {
      const laps = getLocalData('lapangan', []);
      const lMap = {};
      laps.forEach(l => { lMap[l.id] = l; });
      setLapanganMap(lMap);

      const users = getLocalData('users', []);
      const uMap = {};
      users.forEach(u => { uMap[u.id] = u; });
      setUserMap(uMap);

      const resv = getLocalData('reservasi', []);
      setReservasiList(resv);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (idReservasi, newStatus) => {
    if (isConfigured && supabase) {
      await supabase
        .from('reservasi')
        .update({ status: newStatus })
        .eq('id_reservasi', idReservasi);
    } else {
      const allRes = getLocalData('reservasi', []);
      const updated = allRes.map(r =>
        r.id_reservasi === idReservasi ? { ...r, status: newStatus } : r
      );
      setLocalData('reservasi', updated);
    }

    setNotif(`Status reservasi berhasil diubah menjadi: ${newStatus.toUpperCase()}`);
    fetchData();
    setTimeout(() => setNotif(''), 3000);
  };

  const handleDelete = async (idReservasi) => {
    if (!window.confirm('Yakin ingin menghapus data reservasi ini secara permanen?')) return;

    if (isConfigured && supabase) {
      await supabase.from('reservasi').delete().eq('id_reservasi', idReservasi);
    } else {
      const allRes = getLocalData('reservasi', []);
      const filtered = allRes.filter(r => r.id_reservasi !== idReservasi);
      setLocalData('reservasi', filtered);
    }

    setNotif('Data reservasi berhasil dihapus.');
    fetchData();
    setTimeout(() => setNotif(''), 3000);
  };

  const filtered = reservasiList.filter((r) => {
    const lap = lapanganMap[r.id_lapangan];
    const user = userMap[r.id_pelanggan];
    const namaLap = lap?.nama_lapangan || '';
    const namaUser = user?.nama || r.profiles?.nama || '';
    const emailUser = user?.email || r.profiles?.email || '';

    const matchSearch =
      namaLap.toLowerCase().includes(search.toLowerCase()) ||
      namaUser.toLowerCase().includes(search.toLowerCase()) ||
      emailUser.toLowerCase().includes(search.toLowerCase()) ||
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
            ADMIN PORTAL
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Kelola Seluruh Reservasi
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Lihat data pemesanan semua pelanggan, ubah status manual, atau hapus data
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
              placeholder="Cari pelanggan / lapangan / TRX..."
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
        <div className="mb-6 p-4 rounded-2xl bg-[#f0fdf4] border border-[#16ca2e] text-[#15803d] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-[#6b7280]">Memuat daftar reservasi...</div>
      ) : (
        <div className="bg-white rounded-[28px] border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-xs font-semibold text-[#6b7280] uppercase tracking-wider bg-[#fcfcfc]">
                  <th className="py-3.5 px-5">ID Transaksi & Pelanggan</th>
                  <th className="py-3.5 px-5">Lapangan</th>
                  <th className="py-3.5 px-5">Jadwal Main</th>
                  <th className="py-3.5 px-5">Total Bayar</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] text-sm">
                {filtered.map((res) => {
                  const lap = lapanganMap[res.id_lapangan];
                  const usr = userMap[res.id_pelanggan] || res.profiles;
                  return (
                    <tr key={res.id_reservasi} className="hover:bg-[#f0f4fe]/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-mono text-xs text-[#145aff] font-bold">
                          {res.id_transaksi}
                        </div>
                        <div className="font-semibold text-[#020520] text-sm mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#6b7280]" />
                          <span>{usr?.nama || 'Pelanggan'}</span>
                        </div>
                        <div className="text-xs text-[#6b7280]">{usr?.email || ''}</div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#f0f4fe] text-[#145aff]">
                          {lap?.jenis || 'Olahraga'}
                        </span>
                        <div className="font-medium text-[#14141e] mt-1 text-sm">
                          {lap?.nama_lapangan || `Lapangan #${res.id_lapangan}`}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-[#374151] font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#145aff]" />
                          <span>{res.tanggal}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#6b7280] mt-1">
                          <Clock className="w-3.5 h-3.5 text-[#145aff]" />
                          <span>{res.jam_mulai} – {res.jam_selesai} WIB</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-[#020520]">
                        Rp {res.total_bayar.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-5">
                        <StatusBadge status={res.status} />
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={res.status}
                            onChange={(e) => handleUpdateStatus(res.id_reservasi, e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] text-xs font-medium text-[#14141e] focus:outline-none focus:border-[#145aff]"
                          >
                            <option value="pending">Set Pending</option>
                            <option value="dikonfirmasi">Set Dikonfirmasi</option>
                            <option value="selesai">Set Selesai</option>
                            <option value="dibatalkan">Set Dibatalkan</option>
                          </select>

                          <button
                            onClick={() => handleDelete(res.id_reservasi)}
                            title="Hapus Data"
                            className="p-2 rounded-xl text-[#6b7280] hover:text-[#f26052] hover:bg-[#fef2f2] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
