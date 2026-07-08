import React, { useState, useEffect } from 'react';
import { supabase, isConfigured, getLocalData, setLocalData } from '../../lib/supabase';
import { Plus, Edit2, Trash2, CheckCircle2, ShieldAlert, Trophy, Flame } from 'lucide-react';

export default function KelolaLapangan() {
  const [lapanganList, setLapanganList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semua'); // 'semua' | 'futsal' | 'badminton'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notif, setNotif] = useState('');

  const [formData, setFormData] = useState({
    nama_lapangan: '',
    jenis: 'futsal',
    harga_per_jam: 150000,
    status: 'aktif',
    deskripsi: ''
  });

  useEffect(() => {
    fetchLapangan();
  }, []);

  const fetchLapangan = async () => {
    setLoading(true);
    if (isConfigured && supabase) {
      const { data } = await supabase.from('lapangan').select('*').order('id');
      setLapanganList(data || []);
    } else {
      const data = getLocalData('lapangan', []);
      setLapanganList(data);
    }
    setLoading(false);
  };

  const handleOpenAdd = (defaultJenis = 'futsal') => {
    setEditingId(null);
    setFormData({
      nama_lapangan: '',
      jenis: defaultJenis,
      harga_per_jam: defaultJenis === 'futsal' ? 150000 : 65000,
      status: 'aktif',
      deskripsi: '',
      gambar_url: defaultJenis === 'futsal'
        ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lap) => {
    setEditingId(lap.id);
    setFormData({
      nama_lapangan: lap.nama_lapangan,
      jenis: lap.jenis,
      harga_per_jam: lap.harga_per_jam,
      status: lap.status,
      deskripsi: lap.deskripsi || '',
      gambar_url: lap.gambar_url || ''
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, gambar_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isConfigured && supabase) {
      if (editingId) {
        await supabase.from('lapangan').update(formData).eq('id', editingId);
      } else {
        await supabase.from('lapangan').insert([formData]);
      }
    } else {
      const current = getLocalData('lapangan', []);
      if (editingId) {
        const updated = current.map(l => l.id === editingId ? { ...l, ...formData } : l);
        setLocalData('lapangan', updated);
      } else {
        const newLap = {
          id: Date.now(),
          ...formData
        };
        setLocalData('lapangan', [...current, newLap]);
      }
    }

    setIsModalOpen(false);
    setNotif(editingId ? 'Data lapangan berhasil diperbarui!' : 'Lapangan baru berhasil ditambahkan!');
    fetchLapangan();
    setTimeout(() => setNotif(''), 3000);
  };

  const handleToggleStatus = async (lap) => {
    const newStatus = lap.status === 'aktif' ? 'nonaktif' : 'aktif';
    if (isConfigured && supabase) {
      await supabase.from('lapangan').update({ status: newStatus }).eq('id', lap.id);
    } else {
      const current = getLocalData('lapangan', []);
      const updated = current.map(l => l.id === lap.id ? { ...l, status: newStatus } : l);
      setLocalData('lapangan', updated);
    }
    fetchLapangan();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data lapangan ini?')) return;
    if (isConfigured && supabase) {
      await supabase.from('lapangan').delete().eq('id', id);
    } else {
      const current = getLocalData('lapangan', []);
      const filtered = current.filter(l => l.id !== id);
      setLocalData('lapangan', filtered);
    }
    setNotif('Lapangan berhasil dihapus.');
    fetchLapangan();
    setTimeout(() => setNotif(''), 3000);
  };

  // Pisahkan data Futsal dan Badminton
  const futsalList = lapanganList.filter(l => l.jenis?.toLowerCase() === 'futsal');
  const badmintonList = lapanganList.filter(l => l.jenis?.toLowerCase() === 'badminton');

  const renderCard = (lap, accentType) => (
    <div
      key={lap.id}
      className="bg-white rounded-[24px] border border-[#e2e8f0] overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
    >
      <div>
        {/* Banner Gambar Lapangan */}
        <div className="relative h-44 w-full bg-[#f1f5f9] overflow-hidden">
          <img
            src={lap.gambar_url || (accentType === 'futsal' 
              ? 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
              : 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80')}
            alt={lap.nama_lapangan}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <span className={`text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-sm ${
              accentType === 'futsal'
                ? 'bg-[#145aff] text-white'
                : 'bg-[#15803d] text-white'
            }`}>
              {accentType === 'futsal' ? '⚽ Futsal' : '🏸 Badminton'}
            </span>

            <span
              onClick={() => handleToggleStatus(lap)}
              className={`cursor-pointer text-xs font-medium px-3 py-1 rounded-full border shadow-sm transition-all ${
                lap.status === 'aktif'
                  ? 'bg-[#f0fdf4] text-[#15803d] border-[#16ca2e]'
                  : 'bg-[#fef2f2] text-[#b91c1c] border-[#f87171]'
              }`}
              title="Klik untuk ubah status Aktif/Nonaktif"
            >
              {lap.status === 'aktif' ? '● Aktif' : '○ Nonaktif'}
            </span>
          </div>
        </div>

        <div className="p-6 pb-2">
          <h3 className="text-lg font-semibold text-[#020520] mb-1">
            {lap.nama_lapangan}
          </h3>
          <p className="text-xs text-[#6b7280] line-clamp-2">
            {lap.deskripsi || 'Tidak ada deskripsi.'}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 border-t border-[#e2e8f0] flex items-center justify-between mt-3">
        <div>
          <span className="text-[10px] text-[#6b7280] block">Tarif per Jam</span>
          <span className="text-base font-mono font-bold text-[#145aff]">
            Rp {lap.harga_per_jam.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(lap)}
            className="p-2.5 rounded-full border border-[#e2e8f0] text-[#374151] hover:bg-[#f0f4fe] hover:text-[#145aff] transition-colors"
            title="Edit Lapangan"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(lap.id)}
            className="p-2.5 rounded-full border border-[#e2e8f0] text-[#6b7280] hover:bg-[#fef2f2] hover:text-[#f26052] transition-colors"
            title="Hapus Lapangan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-[#145aff] tracking-wider uppercase">
            FACILITIES MANAGEMENT
          </span>
          <h1 className="text-3xl font-semibold text-[#020520] tracking-tight mt-1">
            Kelola Data Lapangan Olahraga
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Kategori Futsal dan Badminton dipisah untuk memudahkan pengelolaan harga serta spesifikasi
          </p>
        </div>

        {/* Filter Tab Navigasi */}
        <div className="flex items-center gap-2 bg-[#f1f5f9] p-1.5 rounded-full self-start md:self-auto">
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'semua'
                ? 'bg-white text-[#020520] shadow-xs'
                : 'text-[#6b7280] hover:text-[#020520]'
            }`}
          >
            Semua ({lapanganList.length})
          </button>
          <button
            onClick={() => setActiveTab('futsal')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'futsal'
                ? 'bg-[#145aff] text-white shadow-xs'
                : 'text-[#6b7280] hover:text-[#020520]'
            }`}
          >
            ⚽ Futsal ({futsalList.length})
          </button>
          <button
            onClick={() => setActiveTab('badminton')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'badminton'
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'text-[#6b7280] hover:text-[#020520]'
            }`}
          >
            🏸 Badminton ({badmintonList.length})
          </button>
        </div>
      </div>

      {notif && (
        <div className="mb-6 p-4 rounded-2xl bg-[#f0fdf4] border border-[#16ca2e] text-[#15803d] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-[#6b7280]">Memuat data fasilitas lapangan...</div>
      ) : (
        <div className="space-y-12">
          {/* SECTION 1: LAPANGAN FUTSAL */}
          {(activeTab === 'semua' || activeTab === 'futsal') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#f0f4fe] text-[#145aff] flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#020520]">
                      Kategori Lapangan Futsal
                    </h2>
                    <p className="text-xs text-[#6b7280]">
                      Standar turnamen vinyl & rumput sintetis ({futsalList.length} Fasilitas)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAdd('futsal')}
                  className="px-4 py-2 rounded-full bg-[#f0f4fe] text-[#145aff] text-xs font-semibold hover:bg-[#145aff] hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Futsal</span>
                </button>
              </div>

              {futsalList.length === 0 ? (
                <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-8 text-center text-xs text-[#6b7280]">
                  Belum ada data lapangan Futsal. Klik "Tambah Futsal" untuk menambahkan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {futsalList.map((lap) => renderCard(lap, 'futsal'))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: LAPANGAN BADMINTON */}
          {(activeTab === 'semua' || activeTab === 'badminton') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] text-[#15803d] flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#020520]">
                      Kategori Lapangan Badminton
                    </h2>
                    <p className="text-xs text-[#6b7280]">
                      Karpet antislip Yonex pro & lantai kayu parquet ({badmintonList.length} Fasilitas)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAdd('badminton')}
                  className="px-4 py-2 rounded-full bg-[#f0fdf4] text-[#15803d] text-xs font-semibold hover:bg-[#15803d] hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Badminton</span>
                </button>
              </div>

              {badmintonList.length === 0 ? (
                <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-8 text-center text-xs text-[#6b7280]">
                  Belum ada data lapangan Badminton. Klik "Tambah Badminton" untuk menambahkan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badmintonList.map((lap) => renderCard(lap, 'badminton'))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold text-[#020520] mb-4">
              {editingId ? 'Edit Data Lapangan' : `Tambah Lapangan ${formData.jenis === 'futsal' ? 'Futsal' : 'Badminton'} Baru`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Nama Lapangan</label>
                <input
                  type="text"
                  required
                  value={formData.nama_lapangan}
                  onChange={(e) => setFormData({ ...formData, nama_lapangan: e.target.value })}
                  placeholder={formData.jenis === 'futsal' ? 'Contoh: Futsal Arena C (Vinyl)' : 'Contoh: Badminton Court 4 (Yonex)'}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Jenis Olahraga</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm font-semibold"
                  >
                    <option value="futsal">⚽ Futsal</option>
                    <option value="badminton">🏸 Badminton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#374151] mb-1">Harga / Jam (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.harga_per_jam}
                    onChange={(e) => setFormData({ ...formData, harga_per_jam: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Status Operasional</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm"
                >
                  <option value="aktif">Aktif (Bisa Dipesan)</option>
                  <option value="nonaktif">Nonaktif / Dalam Perbaikan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5">
                  Upload Foto Lapangan (Dari Perangkat)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 rounded-xl border border-[#145aff] bg-[#f0f4fe] text-[#145aff] hover:bg-[#145aff] hover:text-white transition-all text-xs font-semibold flex items-center gap-2">
                    <span>📁 Pilih Foto dari HP / PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.gambar_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gambar_url: '' })}
                      className="text-xs text-[#f87171] hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {formData.gambar_url && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-[#e2e8f0] h-28 w-full relative bg-[#f1f5f9]">
                    <img
                      src={formData.gambar_url}
                      alt="Pratinjau Foto"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px]">
                      Foto Siap Disimpan
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Deskripsi Lapangan</label>
                <textarea
                  rows="2"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Fasilitas lapangan..."
                  className="w-full px-4 py-2 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#374151] hover:bg-[#f1f5f9]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#145aff] text-white text-xs font-medium hover:bg-[#0042e6] shadow-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
