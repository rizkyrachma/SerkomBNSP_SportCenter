import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import { Plus, Edit2, ToggleLeft, ToggleRight, MapPin } from 'lucide-react'

export default function AdminLapangan() {
  const { addToast } = useToast()
  const [lapangan, setLapangan] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchLapangan()
  }, [])

  const fetchLapangan = async () => {
    const { data } = await supabase
      .from('lapangan')
      .select('*')
      .order('jenis')
      .order('nama')
    setLapangan(data || [])
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingId(null)
    reset({ nama: '', jenis: 'futsal', harga_per_jam: '', status_aktif: true })
    setShowModal(true)
  }

  const handleEdit = (lap) => {
    setEditingId(lap.id)
    setValue('nama', lap.nama)
    setValue('jenis', lap.jenis)
    setValue('harga_per_jam', lap.harga_per_jam)
    setValue('status_aktif', lap.status_aktif)
    setShowModal(true)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        nama: data.nama,
        jenis: data.jenis,
        harga_per_jam: Number(data.harga_per_jam),
        status_aktif: data.status_aktif === true || data.status_aktif === 'true',
      }

      if (editingId) {
        const { error } = await supabase
          .from('lapangan')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        addToast('Lapangan berhasil diperbarui', 'success')
      } else {
        const { error } = await supabase
          .from('lapangan')
          .insert(payload)
        if (error) throw error
        addToast('Lapangan berhasil ditambahkan', 'success')
      }

      setShowModal(false)
      reset()
      fetchLapangan()
    } catch (err) {
      addToast('Gagal menyimpan: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (lap) => {
    try {
      const { error } = await supabase
        .from('lapangan')
        .update({ status_aktif: !lap.status_aktif })
        .eq('id', lap.id)
      if (error) throw error
      addToast(
        lap.status_aktif ? 'Lapangan dinonaktifkan' : 'Lapangan diaktifkan',
        'success'
      )
      fetchLapangan()
    } catch (err) {
      addToast('Gagal mengubah status: ' + err.message, 'error')
    }
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num)
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '0.25rem',
          }}>
            Data Lapangan
          </h2>
          <p style={{ color: 'var(--color-muted-indigo)', fontSize: '0.875rem' }}>
            Kelola lapangan futsal & badminton
          </p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus size={16} />
          Tambah Lapangan
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: '60px' }} />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Jenis</th>
                <th>Harga/Jam</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {lapangan.map(lap => (
                <tr key={lap.id} style={{
                  opacity: lap.status_aktif ? 1 : 0.5,
                }}>
                  <td>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <MapPin size={14} style={{ color: 'var(--color-atlassian-blue)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500 }}>{lap.nama}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '6px',
                      background: lap.jenis === 'futsal' ? '#e3fcef' : '#e6effa',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                    }}>
                      {lap.jenis === 'futsal' ? '⚽' : '🏸'} {lap.jenis}
                    </span>
                  </td>
                  <td style={{
                    fontFamily: 'var(--font-family-display)',
                    fontWeight: 600,
                  }}>
                    {formatCurrency(lap.harga_per_jam)}
                  </td>
                  <td>
                    <span className={`badge ${lap.status_aktif ? 'badge-available' : 'badge-full'}`}>
                      {lap.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => handleEdit(lap)}
                        className="btn btn-ghost btn-sm"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(lap)}
                        className="btn btn-ghost btn-sm"
                        title={lap.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {lap.status_aktif ? (
                          <ToggleRight size={16} style={{ color: 'var(--color-status-available)' }} />
                        ) : (
                          <ToggleLeft size={16} style={{ color: 'var(--color-status-full)' }} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Lapangan' : 'Tambah Lapangan'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Nama Lapangan</label>
            <input
              type="text"
              className={`input ${errors.nama ? 'input-error' : ''}`}
              placeholder="Contoh: Futsal Lapangan 1"
              {...register('nama', { required: 'Nama wajib diisi' })}
            />
            {errors.nama && <p className="error-text">{errors.nama.message}</p>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Jenis</label>
            <select
              className="select"
              {...register('jenis', { required: true })}
            >
              <option value="futsal">Futsal</option>
              <option value="badminton">Badminton</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Harga per Jam (Rp)</label>
            <input
              type="number"
              className={`input ${errors.harga_per_jam ? 'input-error' : ''}`}
              placeholder="Contoh: 150000"
              {...register('harga_per_jam', {
                required: 'Harga wajib diisi',
                min: { value: 1000, message: 'Minimal Rp 1.000' },
              })}
            />
            {errors.harga_per_jam && <p className="error-text">{errors.harga_per_jam.message}</p>}
          </div>

          <div style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <input
              type="checkbox"
              id="status_aktif"
              {...register('status_aktif')}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="status_aktif" style={{
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}>
              Lapangan aktif
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
