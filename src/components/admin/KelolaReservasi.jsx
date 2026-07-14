import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CalendarCheck, Search, AlertTriangle, X, Eye, Edit, Trash2, Plus } from 'lucide-react';
import ModalCardAlert from '../common/ModalCardAlert';

export default function KelolaReservasi() {
  const [reservasis, setReservasis] = useState([]);
  const [lapangans, setLapangans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterLapangan, setFilterLapangan] = useState('semua');
  const [detailModal, setDetailModal] = useState(null);
  const [crudModal, setCrudModal] = useState(null);
  const [modalCard, setModalCard] = useState(null);

  const fetchMasterData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [{ data: resData, error: resErr }, { data: lapData }] = await Promise.all([
        supabase
          .from('reservasi')
          .select('*, lapangan(*), pelanggan(*), transaksi(*)')
          .not('status', 'in', '("pending_bayar","menunggu_verifikasi")')
          .order('tanggal', { ascending: false }),
        supabase
          .from('lapangan')
          .select('*')
          .eq('status', 'aktif')
      ]);

      if (resErr) {
        console.error('Supabase reservasi fetch error:', resErr);
        throw resErr;
      }
      setReservasis(resData || []);
      setLapangans(lapData || []);
    } catch (err) {
      console.error('fetchMasterData error:', err);
      setErrorMsg(`Gagal memuat data reservasi. ${err?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
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
      fetchMasterData();
    } catch (err) {
      console.error(err);
      setErrorMsg(`Gagal mengubah status reservasi. ${err?.message || ''}`);
    }
  };

  const handleDeleteReservasi = (reservasiId) => {
    setModalCard({
      type: 'confirm',
      title: 'Konfirmasi Hapus Reservasi',
      message: 'Apakah Anda yakin ingin menghapus data reservasi ini secara permanen? Tindakan ini tidak dapat dibatalkan.',
      actionText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      variant: 'danger',
      onConfirm: async () => {
        setModalCard(null);
        try {
          const { error } = await supabase.from('reservasi').delete().eq('id', reservasiId);
          if (error) throw error;
          setReservasis(prev => prev.filter(r => r.id !== reservasiId));
          setModalCard({
            type: 'alert',
            title: 'Berhasil Dihapus',
            message: 'Data reservasi berhasil dihapus dari sistem.',
            variant: 'success'
          });
        } catch (err) {
          console.error(err);
          setModalCard({
            type: 'alert',
            title: 'Gagal Menghapus',
            message: 'Gagal menghapus reservasi: ' + (err?.message || ''),
            variant: 'danger'
          });
        }
      }
    });
  };

  const openCreateModal = () => {
    setCrudModal({
      mode: 'create',
      data: {
        pelanggan_nama: '',
        pelanggan_email: '',
        lapangan_id: lapangans[0]?.id || '',
        tanggal: new Date().toISOString().slice(0, 10),
        jam_mulai: '08:00',
        jam_selesai: '09:00',
        total_harga: 150000,
        status: 'terkonfirmasi'
      }
    });
  };

  const openEditModal = (res) => {
    setCrudModal({
      mode: 'edit',
      id: res.id,
      data: {
        pelanggan_nama: res.pelanggan?.nama || '',
        pelanggan_email: res.pelanggan?.email || '',
        lapangan_id: res.lapangan_id || res.lapangan?.id || lapangans[0]?.id || '',
        tanggal: res.tanggal || '',
        jam_mulai: res.jam_mulai?.slice(0, 5) || '08:00',
        jam_selesai: res.jam_selesai?.slice(0, 5) || '09:00',
        total_harga: res.total_harga || 0,
        status: res.status || 'terkonfirmasi'
      }
    });
  };

  const handleSaveCrud = async (e) => {
    e.preventDefault();
    const { mode, id, data } = crudModal;
    try {
      let plgId = 'PLG-MANUAL';
      if (data.pelanggan_email) {
        const { data: existingPlg } = await supabase.from('pelanggan').select('id').ilike('email', data.pelanggan_email).maybeSingle();
        if (existingPlg?.id) {
          plgId = existingPlg.id;
        } else {
          const newPlgId = `PLG${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from('pelanggan').upsert({
            id: newPlgId,
            nama: data.pelanggan_nama || data.pelanggan_email.split('@')[0],
            email: data.pelanggan_email,
            no_telepon: '-'
          });
          plgId = newPlgId;
        }
      }

      if (mode === 'create') {
        const { error } = await supabase.from('reservasi').insert({
          pelanggan_id: plgId,
          lapangan_id: data.lapangan_id,
          tanggal: data.tanggal,
          jam_mulai: data.jam_mulai.includes(':') && data.jam_mulai.length === 5 ? `${data.jam_mulai}:00` : data.jam_mulai,
          jam_selesai: data.jam_selesai.includes(':') && data.jam_selesai.length === 5 ? `${data.jam_selesai}:00` : data.jam_selesai,
          total_harga: Number(data.total_harga || 0),
          status: data.status
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reservasi').update({
          lapangan_id: data.lapangan_id,
          tanggal: data.tanggal,
          jam_mulai: data.jam_mulai.includes(':') && data.jam_mulai.length === 5 ? `${data.jam_mulai}:00` : data.jam_mulai,
          jam_selesai: data.jam_selesai.includes(':') && data.jam_selesai.length === 5 ? `${data.jam_selesai}:00` : data.jam_selesai,
          total_harga: Number(data.total_harga || 0),
          status: data.status
        }).eq('id', id);
        if (error) throw error;
      }

      setCrudModal(null);
      fetchMasterData();
      setModalCard({
        type: 'alert',
        title: 'Berhasil Disimpan',
        message: mode === 'create' ? 'Reservasi baru berhasil ditambahkan.' : 'Data reservasi berhasil diperbarui.',
        variant: 'success'
      });
    } catch (err) {
      console.error(err);
      setModalCard({
        type: 'alert',
        title: 'Gagal Menyimpan Data',
        message: err?.message || 'Terjadi kesalahan saat menyimpan reservasi.',
        variant: 'danger'
      });
    }
  };

  const filteredReservasis = reservasis.filter((res) => {
    // Filter by date
    if (filterTanggal && res.tanggal !== filterTanggal) return false;

    // Filter by lapangan
    if (filterLapangan !== 'semua' && res.lapangan_id !== filterLapangan && res.lapangan?.id !== filterLapangan) return false;

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
    { value: 'semua', label: 'Semua Status (Selesai)' },
    { value: 'terkonfirmasi', label: 'Terkonfirmasi' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
    { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Data Master</span>
          <h2 className="font-cal-sans text-heading font-semibold text-graphite">Riwayat Transaksi & Reservasi</h2>
          <p className="text-body-sm text-slate font-medium">
            Lihat, saring per lapangan & tanggal, serta kelola (CRUD) data reservasi pelanggan SM Sport Center.
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="px-5 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Tambah Reservasi
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-inputs text-body-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-3 bg-white p-4 rounded-cards border border-silver shadow-sm">
          <Search className="w-4 h-4 text-slate" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, email, lapangan, atau tanggal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none text-body-sm text-graphite font-medium placeholder:text-stone"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-silver rounded-cards px-3 py-3 text-body-sm text-graphite font-semibold shadow-sm">
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer font-semibold text-graphite text-xs sm:text-sm"
          />
          {filterTanggal && (
            <button
              onClick={() => setFilterTanggal('')}
              className="text-slate hover:text-red-500 transition-colors p-1"
              title="Reset Tanggal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={filterLapangan}
          onChange={(e) => setFilterLapangan(e.target.value)}
          className="bg-white border border-silver rounded-cards px-4 py-3 text-body-sm text-graphite font-semibold cursor-pointer focus:outline-none focus:border-ink shadow-sm"
        >
          <option value="semua">Semua Lapangan</option>
          {lapangans.map(l => (
            <option key={l.id} value={l.id}>{l.nama} ({l.jenis})</option>
          ))}
        </select>
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

              {/* Transaction details & Proof link */}
              <div className="border-t border-silver pt-4 mt-2">
                <span className="text-xs text-slate font-bold uppercase block mb-3">Informasi Pembayaran:</span>
                {(() => {
                  const txObj = Array.isArray(detailModal.transaksi)
                    ? (detailModal.transaksi.find(tx => tx.bukti_transfer_url) || detailModal.transaksi[0])
                    : detailModal.transaksi;
                  if (!txObj) {
                    return <span className="text-xs text-slate italic">Belum ada data transaksi tercatat.</span>;
                  }
                  const proofUrl = txObj.bukti_transfer_url
                    ? (txObj.bukti_transfer_url.startsWith('http')
                        ? txObj.bukti_transfer_url
                        : supabase.storage.from('bukti-transfer').getPublicUrl(txObj.bukti_transfer_url).data?.publicUrl)
                    : null;

                  return (
                    <div className="flex flex-col gap-2 bg-paper p-3 rounded-inputs border border-silver/60 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate font-medium">Status Verifikasi:</span>
                        <span className="font-bold uppercase text-graphite">{txObj.status_verifikasi || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate font-medium">Nominal Transfer:</span>
                        <span className="font-mono font-bold text-ink">Rp {Number(txObj.jumlah_bayar || 0).toLocaleString('id-ID')}</span>
                      </div>
                      {proofUrl ? (
                        <div className="mt-2 flex justify-end">
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-ink text-white rounded-tags hover:opacity-90 transition-all shadow-sm"
                          >
                            Lihat Bukti Transfer
                          </a>
                        </div>
                      ) : (
                        <div className="mt-1 text-right text-red-500 font-medium text-[11px]">
                          Belum upload bukti transfer
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailModal(res)}
                          className="p-2 bg-white border border-silver hover:border-ink hover:bg-paper text-slate hover:text-graphite rounded-full transition-all cursor-pointer shadow-sm"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(res)}
                          className="p-2 bg-white border border-silver hover:border-blue-500 hover:bg-blue-50 text-slate hover:text-blue-600 rounded-full transition-all cursor-pointer shadow-sm"
                          title="Edit Reservasi"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReservasi(res.id)}
                          className="p-2 bg-white border border-silver hover:border-red-500 hover:bg-red-50 text-slate hover:text-red-600 rounded-full transition-all cursor-pointer shadow-sm"
                          title="Hapus Reservasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {crudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-silver rounded-cards shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-silver">
              <span className="font-cal-sans text-caption tracking-tight uppercase text-slate font-semibold">
                {crudModal.mode === 'create' ? 'Tambah Reservasi Manual' : 'Edit Reservasi'}
              </span>
              <button
                onClick={() => setCrudModal(null)}
                className="text-slate hover:text-graphite transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCrud} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={crudModal.data.pelanggan_nama}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, pelanggan_nama: e.target.value } })}
                    placeholder="Nama Pelanggan"
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Email Pelanggan</label>
                  <input
                    type="email"
                    required
                    value={crudModal.data.pelanggan_email}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, pelanggan_email: e.target.value } })}
                    placeholder="email@example.com"
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Pilih Lapangan</label>
                  <select
                    value={crudModal.data.lapangan_id}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, lapangan_id: e.target.value } })}
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink bg-white"
                  >
                    {lapangans.map(l => (
                      <option key={l.id} value={l.id}>{l.nama} ({l.jenis})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={crudModal.data.tanggal}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, tanggal: e.target.value } })}
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={crudModal.data.jam_mulai}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, jam_mulai: e.target.value } })}
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={crudModal.data.jam_selesai}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, jam_selesai: e.target.value } })}
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-slate font-semibold uppercase mb-1">Total Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={crudModal.data.total_harga}
                    onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, total_harga: e.target.value } })}
                    className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate font-semibold uppercase mb-1">Status Reservasi</label>
                <select
                  value={crudModal.data.status}
                  onChange={(e) => setCrudModal({ ...crudModal, data: { ...crudModal.data, status: e.target.value } })}
                  className="w-full border border-silver rounded-inputs p-2 text-graphite font-medium focus:outline-none focus:border-ink bg-white"
                >
                  <option value="terkonfirmasi">Terkonfirmasi</option>
                  <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                  <option value="dibatalkan">Dibatalkan</option>
                  <option value="kedaluwarsa">Kedaluwarsa</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-silver pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCrudModal(null)}
                  className="px-4 py-2 border border-silver text-slate hover:text-graphite rounded-tags font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-white rounded-tags font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalCardAlert card={modalCard} onClose={() => setModalCard(null)} />
    </div>
  );
}
