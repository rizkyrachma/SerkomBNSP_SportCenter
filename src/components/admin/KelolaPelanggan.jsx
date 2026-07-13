import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Users, Plus, Edit2, Trash2, X, Save, AlertTriangle, Search } from 'lucide-react';

export default function KelolaPelanggan() {
  const [pelanggans, setPelanggans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPelanggan, setEditingPelanggan] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Form fields
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noTelepon, setNoTelepon] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPelanggans = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('pelanggan')
        .select('*')
        .order('nama', { ascending: true });

      if (error) {
        console.error('Supabase pelanggan fetch error:', error);
        throw error;
      }
      console.log('Pelanggan data fetched:', data?.length, 'rows');
      setPelanggans(data || []);
    } catch (err) {
      console.error('fetchPelanggans error:', err);
      setErrorMsg(`Gagal memuat data pelanggan. ${err?.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPelanggans();
  }, []);

  const handleAddNewClick = () => {
    setEditingPelanggan(null);
    setNama('');
    setEmail('');
    setNoTelepon('');
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleEditClick = (plg) => {
    setEditingPelanggan(plg);
    setNama(plg.nama);
    setEmail(plg.email);
    setNoTelepon(plg.no_telepon);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nama || !email || !noTelepon) {
      setErrorMsg('Harap lengkapi semua kolom wajib.');
      return;
    }

    try {
      if (editingPelanggan) {
        const { error } = await supabase
          .from('pelanggan')
          .update({ nama, email, no_telepon: noTelepon })
          .eq('id', editingPelanggan.id);

        if (error) throw error;
        setSuccessMsg('Data pelanggan berhasil diperbarui.');
      } else {
        // Generate a PLG ID
        const newId = 'PLG' + String(Math.floor(Math.random() * 9000 + 1000));
        const { error } = await supabase
          .from('pelanggan')
          .insert({ id: newId, nama, email, no_telepon: noTelepon });

        if (error) throw error;
        setSuccessMsg('Pelanggan baru berhasil ditambahkan.');
      }

      setIsFormOpen(false);
      fetchPelanggans();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyimpan data pelanggan.');
    }
  };

  const handleDelete = async (plg) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase
        .from('pelanggan')
        .delete()
        .eq('id', plg.id);

      if (error) throw error;
      setSuccessMsg(`Pelanggan "${plg.nama}" berhasil dihapus.`);
      setConfirmDelete(null);
      fetchPelanggans();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menghapus pelanggan. Mungkin pelanggan masih memiliki reservasi aktif.');
      setConfirmDelete(null);
    }
  };

  const filteredPelanggans = pelanggans.filter((plg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      plg.nama?.toLowerCase().includes(q) ||
      plg.email?.toLowerCase().includes(q) ||
      plg.no_telepon?.includes(q) ||
      plg.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Data Master</span>
          <h2 className="font-cal-sans text-heading font-semibold text-graphite">Kelola Pelanggan</h2>
          <p className="text-body-sm text-slate font-medium">
            Lihat, tambah, edit, atau hapus data pelanggan SM Sport Center.
          </p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="px-6 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-inputs text-body-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-action-blue px-4 py-3 rounded-inputs text-body-sm font-semibold shadow-sm">
          <Users className="w-5 h-5 text-action-blue flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-cards border border-silver shadow-sm">
        <Search className="w-4 h-4 text-slate" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama, email, atau telepon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent focus:outline-none text-body-sm text-graphite font-medium placeholder:text-stone"
        />
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-silver rounded-cards shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-silver">
              <span className="font-cal-sans text-caption tracking-tight uppercase text-slate font-semibold">
                {editingPelanggan ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </span>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate hover:text-graphite transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-graphite font-bold">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-graphite font-bold">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!editingPelanggan}
                  className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-medium disabled:bg-paper disabled:text-slate"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-graphite font-bold">No. Telepon *</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={noTelepon}
                  onChange={(e) => setNoTelepon(e.target.value)}
                  className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-medium"
                />
              </div>

              <div className="p-6 border-t border-silver bg-paper flex gap-3 justify-end -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 bg-white border border-silver text-graphite rounded-tags text-body-sm font-semibold hover:bg-paper transition-all cursor-pointer shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4 text-action-blue" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-silver rounded-cards shadow-sm overflow-hidden flex flex-col p-6 gap-4">
            <h3 className="font-cal-sans text-body font-bold text-graphite">Konfirmasi Hapus</h3>
            <p className="text-body-sm text-slate font-medium">
              Apakah Anda yakin ingin menghapus pelanggan <span className="font-bold text-graphite">"{confirmDelete.nama}"</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2 bg-white border border-silver text-graphite rounded-tags text-body-sm font-semibold hover:bg-paper transition-all cursor-pointer shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-5 py-2 bg-red-600 text-white rounded-tags text-body-sm font-semibold hover:bg-red-700 transition-all cursor-pointer shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-12 h-12 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
        </div>
      ) : filteredPelanggans.length === 0 ? (
        <div className="bg-white border border-silver rounded-cards p-12 text-center text-slate font-semibold shadow-sm">
          {searchQuery ? 'Tidak ditemukan pelanggan yang cocok.' : 'Belum ada data pelanggan.'}
        </div>
      ) : (
        <div className="bg-white border border-silver rounded-cards shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-paper border-b border-silver">
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Nama</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">No. Telepon</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider">Terdaftar</th>
                  <th className="p-4 text-xs text-slate font-bold uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPelanggans.map((plg, idx) => (
                  <tr
                    key={plg.id}
                    className={`border-b border-silver/50 hover:bg-paper/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-paper/30'}`}
                  >
                    <td className="p-4 text-body-sm font-mono font-semibold text-slate">{plg.id}</td>
                    <td className="p-4 text-body-sm font-bold text-graphite">{plg.nama}</td>
                    <td className="p-4 text-body-sm text-slate font-medium">{plg.email}</td>
                    <td className="p-4 text-body-sm text-slate font-medium">{plg.no_telepon}</td>
                    <td className="p-4 text-body-sm text-slate font-medium">
                      {plg.created_at ? new Date(plg.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(plg)}
                          className="p-2 bg-white border border-silver hover:border-ink hover:bg-paper text-slate hover:text-graphite rounded-full transition-all cursor-pointer shadow-sm"
                          title="Edit Pelanggan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(plg)}
                          className="p-2 bg-white border border-silver hover:border-red-500 hover:bg-red-50 text-slate hover:text-red-500 rounded-full transition-all cursor-pointer shadow-sm"
                          title="Hapus Pelanggan"
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
            Total: {filteredPelanggans.length} pelanggan
          </div>
        </div>
      )}
    </div>
  );
}
