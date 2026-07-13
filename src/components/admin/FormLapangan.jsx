import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit2, Image, Save, X, AlertTriangle } from 'lucide-react';

export default function FormLapangan() {
  const [lapangans, setLapangans] = useState([]);
  const [editingLapangan, setEditingLapangan] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState('futsal');
  const [harga, setHarga] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [status, setStatus] = useState('aktif');
  
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchLapangans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lapangan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLapangans(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat data lapangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLapangans();
  }, []);

  const handleEditClick = (lap) => {
    setEditingLapangan(lap);
    setNama(lap.nama);
    setJenis(lap.jenis);
    setHarga(Number(lap.harga_per_jam));
    setFotoUrl(lap.foto_url || '');
    setStatus(lap.status);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingLapangan(null);
    setNama('');
    setJenis('futsal');
    setHarga('');
    setFotoUrl('');
    setStatus('aktif');
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `field_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('lapangan-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('lapangan-photos')
        .getPublicUrl(fileName);

      setFotoUrl(publicData.publicUrl);
      setSuccessMsg('Foto lapangan berhasil diunggah!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengunggah foto lapangan.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nama || !harga) {
      setErrorMsg('Harap lengkapi semua kolom wajib.');
      return;
    }

    try {
      const payload = {
        nama,
        jenis,
        harga_per_jam: Number(harga),
        foto_url: fotoUrl || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop',
        status
      };

      if (editingLapangan) {
        const { error } = await supabase
          .from('lapangan')
          .update(payload)
          .eq('id', editingLapangan.id);

        if (error) throw error;
        setSuccessMsg('Lapangan berhasil diperbarui.');
      } else {
        const { error } = await supabase
          .from('lapangan')
          .insert(payload);

        if (error) throw error;
        setSuccessMsg('Lapangan baru berhasil ditambahkan.');
      }

      setIsFormOpen(false);
      fetchLapangans();
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan data lapangan.');
    }
  };

  const toggleStatus = async (lap) => {
    setErrorMsg('');
    setSuccessMsg('');
    const newStatus = lap.status === 'aktif' ? 'nonaktif' : 'aktif';
    try {
      const { error } = await supabase
        .from('lapangan')
        .update({ status: newStatus })
        .eq('id', lap.id);

      if (error) throw error;
      setSuccessMsg(`Status ${lap.nama} diubah menjadi ${newStatus}`);
      fetchLapangans();
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mengubah status lapangan.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-cal-sans text-caption text-slate uppercase font-semibold">Data Master</span>
          <h2 className="font-cal-sans text-heading font-semibold text-graphite">Kelola Lapangan</h2>
          <p className="text-body-sm text-slate font-medium">
            Tambah, edit, atau nonaktifkan lapangan futsal dan badminton SM Sport Center.
          </p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="px-6 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Lapangan
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
          <Plus className="w-5 h-5 text-action-blue flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Field Editor Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-silver rounded-cards shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-silver">
              <span className="font-cal-sans text-caption tracking-tight uppercase text-slate font-semibold">
                {editingLapangan ? 'Edit Detail Lapangan' : 'Tambah Lapangan Baru'}
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
                <label className="text-body-sm text-graphite font-bold">Nama Lapangan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lapangan Futsal 3"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm text-graphite font-bold">Jenis Lapangan *</label>
                  <select
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                    className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-semibold cursor-pointer"
                  >
                    <option value="futsal">Futsal</option>
                    <option value="badminton">Badminton</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-body-sm text-graphite font-bold">Tarif per Jam (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={harga}
                    onChange={(e) => setHarga(e.target.value)}
                    className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-graphite font-bold">Status Lapangan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-white border border-silver rounded-inputs px-4 py-2.5 text-graphite focus:outline-none focus:border-ink text-body-sm font-semibold cursor-pointer"
                >
                  <option value="aktif">Aktif (Dapat Dipesan)</option>
                  <option value="nonaktif">Nonaktif (Dalam Perawatan)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-silver pt-4">
                <label className="text-body-sm text-graphite font-bold">Foto Lapangan</label>
                <div className="flex items-center gap-4">
                  <label className="px-4 py-2.5 bg-white border border-silver hover:border-slate text-graphite rounded-inputs text-body-sm cursor-pointer flex items-center gap-2 transition-colors font-semibold shadow-sm">
                    <Image className="w-4 h-4 text-slate" />
                    {uploading ? 'Mengunggah...' : 'Upload Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {fotoUrl && (
                    <span className="text-[11px] text-action-blue font-semibold truncate max-w-[200px]">
                      Foto berhasil ditambahkan!
                    </span>
                  )}
                </div>
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
                  disabled={uploading}
                  className="px-6 py-2.5 bg-ink text-white rounded-tags text-body-sm font-semibold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4 text-action-blue" />
                  Simpan Lapangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fields List: White cards with 12px radius, silver border */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-12 h-12 border-2 border-silver border-t-ink rounded-full animate-spin"></div>
        </div>
      ) : lapangans.length === 0 ? (
        <div className="bg-white border border-silver rounded-cards p-12 text-center text-slate font-semibold shadow-sm">
          Belum ada lapangan terdaftar. Klik tombol Tambah Lapangan untuk memulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lapangans.map((lap) => (
            <div
              key={lap.id}
              className="bg-white rounded-cards border border-silver overflow-hidden flex flex-col justify-between shadow-sm"
            >
              {/* Field Image */}
              <div className="aspect-video relative overflow-hidden bg-paper border-b border-silver">
                <img
                  src={lap.foto_url || 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=600&auto=format&fit=crop'}
                  alt={lap.nama}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-4 right-4 px-3 py-1 text-[9px] font-bold uppercase rounded-tags tracking-wider ${
                    lap.status === 'aktif'
                      ? 'bg-ink text-white'
                      : 'bg-silver text-slate'
                  }`}
                >
                  {lap.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Info & Action Panel */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <span className="font-cal-sans text-caption text-slate uppercase font-semibold capitalize">
                    {lap.jenis}
                  </span>
                  <h3 className="font-cal-sans text-body font-bold text-graphite truncate">{lap.nama}</h3>
                  <span className="text-body-sm font-bold text-ink">
                    Rp {Number(lap.harga_per_jam).toLocaleString('id-ID')} / jam
                  </span>
                </div>

                <div className="flex gap-2 border-t border-silver pt-4 mt-2 font-semibold">
                  <button
                    onClick={() => handleEditClick(lap)}
                    className="flex-1 py-2 bg-white border border-silver hover:bg-paper text-graphite rounded-tags text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate" />
                    Edit Detail
                  </button>
                  <button
                    onClick={() => toggleStatus(lap)}
                    className={`px-3 py-2 border rounded-tags text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                      lap.status === 'aktif'
                        ? 'border-silver hover:border-red-500 hover:bg-red-50 text-slate hover:text-red-500'
                        : 'border-silver hover:border-ink hover:bg-paper text-slate hover:text-graphite'
                    }`}
                    title={lap.status === 'aktif' ? 'Nonaktifkan Lapangan' : 'Aktifkan Lapangan'}
                  >
                    {lap.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
