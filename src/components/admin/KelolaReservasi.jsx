import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CalendarCheck, Search, AlertTriangle, X, Eye } from 'lucide-react';

export default function KelolaReservasi() {
  const [reservasis, setReservasis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [detailModal, setDetailModal] = useState(null);

  const fetchReservasis = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('reservasi')
        .select('*, lapangan(*), pelanggan(*), transaksi(*)')
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('Supabase reservasi fetch error:', error);
        throw error;
      }
      setReservasis(data || []);
    } catch (err) {
      console.error('fetchReservasis error:', err);
      setErrorMsg(`Gagal memuat data reservasi. ${err?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservasis();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      'pending_bayar': { label: 'Pending Bayar', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
      'menunggu_verifikasi': { label: 'Menunggu Verifikasi', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
      'terkonfirmasi': { label: 'Terkonfirmasi', cls: 'bg-green-100 text-green-800 border-green-200' },
      'dibatalkan': { label: 'Dibatalkan', cls: 'bg-red-100 text-red-800 border-red-200' },
      'kedaluwarsa': { label: 'Kedaluwarsa', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    };
    const info = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
    return (
      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-tags tracking-wider border ${info.cls}`}>
        {info.label}
      </span>
    );
  };

  const handleUpdateStatus = async (reservasiId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservasi')
        .update({ status: newStatus })
        .eq('id', reservasiId);

      if (error) throw error;
      setDetailModal(null);
      fetchReservasis();
    } catch (err) {
      console.error(err);
      setErrorMsg(`Gagal mengubah status reservasi. ${err?.message || ''}`);
    }
  };

  const filteredReservasis = reservasis.filter((res) => {
    // Filter by status
    if (filterStatus !== 'semua' && res.status !== filterStatus) return false;

    // Filter by search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      res.pelanggan?.nama?.toLowerCase().includes(q) ||
      res.pelanggan?.email?.toLowerCase().includes(q) ||
      res.lapangan?.nama?.toLowerCase().includes(q) ||
      res.id?.toLowerCase().includes(q) ||
      res.tanggal?.includes(q)
    );
  });

  const statusOptions = [
    { value: 'semua', label: 'Semua Status' },
    { value: 'pending_bayar', label: 'Pending Bayar' },
    { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
    { value: 'terkonfirmasi', label: 'Terkonfirmasi' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
    { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      <div className="flex flex-col gap-1">
        <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Data Master</span>
        <h2 className="font-cal-sans text-heading font-semibold text-graphite">Daftar Reservasi</h2>
        <p className="text-body-sm text-slate font-medium">
          Lihat dan kelola semua reservasi pelanggan SM Sport Center.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-inputs text-body-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white p-4 rounded-cards border border-silver shadow-sm">
          <Search className="w-4 h-4 text-slate" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, email, lapangan, atau tanggal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-body-sm text-graphite font-medium placeholder:text-stone"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-silver rounded-cards px-4 py-3 text-body-sm text-graphite font-semibold cursor-pointer focus:outline-none focus:border-ink shadow-sm"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-silver rounded-cards shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-silver">
              <span className="font-cal-sans text-caption tracking-tight uppercase text-slate font-semibold">
                Detail Reservasi
              </span>
              <button
                onClick={() => setDetailModal(null)}
                className="text-slate hover:text-graphite transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">ID Reservasi</span>
                  <span className="text-graphite font-mono font-medium text-xs">{detailModal.id}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Status</span>
                  {getStatusBadge(detailModal.status)}
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Pelanggan</span>
                  <span className="text-graphite font-bold">{detailModal.pelanggan?.nama || '-'}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Email</span>
                  <span className="text-graphite font-medium">{detailModal.pelanggan?.email || '-'}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Lapangan</span>
                  <span className="text-graphite font-bold">{detailModal.lapangan?.nama || '-'}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Jenis</span>
                  <span className="text-graphite font-medium capitalize">{detailModal.lapangan?.jenis || '-'}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Tanggal</span>
                  <span className="text-graphite font-bold">{detailModal.tanggal}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Jam</span>
                  <span className="text-graphite font-bold">
                    {detailModal.jam_mulai?.slice(0,5)} - {detailModal.jam_selesai?.slice(0,5)}
                  </span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">Total Harga</span>
                  <span className="text-ink font-bold">Rp {Number(detailModal.total_harga || 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-slate font-semibold block text-xs uppercase">No. Telepon</span>
                  <span className="text-graphite font-medium">{detailModal.pelanggan?.no_telepon || '-'}</span>
                </div>
              </div>

              {/* Quick status change buttons */}
              <div className="border-t border-silver pt-4 mt-2">
                <span className="text-xs text-slate font-bold uppercase block mb-3">Ubah Status:</span>
                <div className="flex flex-wrap gap-2">
                  {detailModal.status !== 'terkonfirmasi' && (
                    <button
                      onClick={() => handleUpdateStatus(detailModal.id, 'terkonfirmasi')}
                      className="px-4 py-2 bg-green-600 text-white rounded-tags text-xs font-semibold hover:bg-green-700 transition-all cursor-pointer shadow-sm"
                    >
                      Konfirmasi
                    </button>
                  )}
                  {detailModal.status !== 'dibatalkan' && detailModal.status !== 'terkonfirmasi' && (
                    <button
                      onClick={() => handleUpdateStatus(detailModal.id, 'dibatalkan')}
                      className="px-4 py-2 bg-red-600 text-white rounded-tags text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer shadow-sm"
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-12 h-12 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
        </div>
      ) : filteredReservasis.length === 0 ? (
        <div className="bg-white border border-silver rounded-cards p-12 text-center text-slate font-semibold shadow-sm">
          {searchQuery || filterStatus !== 'semua' ? 'Tidak ditemukan reservasi yang cocok.' : 'Belum ada data reservasi.'}
        </div>
      ) : (
        <div className="bg-white border border-silver rounded-cards shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-paper border-b border-silver">
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Tanggal</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Pelanggan</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Lapangan</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Jam</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Total</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservasis.map((res, idx) => (
                  <tr
                    key={res.id}
                    className={`border-b border-silver/50 hover:bg-paper/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-paper/30'}`}
                  >
                    <td className="p-4 text-body-sm font-bold text-graphite whitespace-nowrap">{res.tanggal}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-body-sm font-bold text-graphite">{res.pelanggan?.nama || '-'}</span>
                        <span className="text-xs text-slate font-medium">{res.pelanggan?.email || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-body-sm font-bold text-graphite">{res.lapangan?.nama || '-'}</span>
                        <span className="text-xs text-slate font-medium capitalize">{res.lapangan?.jenis || '-'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-body-sm font-semibold text-graphite whitespace-nowrap">
                      {res.jam_mulai?.slice(0,5)} - {res.jam_selesai?.slice(0,5)}
                    </td>
                    <td className="p-4 text-body-sm font-bold text-ink whitespace-nowrap">
                      Rp {Number(res.total_harga || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">{getStatusBadge(res.status)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setDetailModal(res)}
                        className="p-2 bg-white border border-silver hover:border-ink hover:bg-paper text-slate hover:text-graphite rounded-full transition-all cursor-pointer shadow-sm"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-silver bg-paper text-xs text-slate font-semibold text-center">
            Total: {filteredReservasis.length} reservasi
          </div>
        </div>
      )}
    </div>
  );
}
