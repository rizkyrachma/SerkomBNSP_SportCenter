import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import { CreditCard, Plus, Search } from 'lucide-react'

export default function AdminTransaksi() {
  const { profile } = useAuth()
  const { addToast } = useToast()
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPayModal, setShowPayModal] = useState(false)
  const [pendingBookings, setPendingBookings] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()

  useEffect(() => {
    fetchTransaksi()
  }, [])

  const fetchTransaksi = async () => {
    const { data } = await supabase
      .from('transaksi')
      .select('*, booking(tanggal, jam_mulai, jam_selesai, total_harga, lapangan(nama), profiles(nama_lengkap)), dicatat_oleh_profile:profiles!transaksi_dicatat_oleh_fkey(nama_lengkap)')
      .order('waktu_bayar', { ascending: false })

    setTransaksi(data || [])
    setLoading(false)
  }

  const fetchPendingBookings = async () => {
    const { data } = await supabase
      .from('booking')
      .select('*, lapangan(nama), profiles(nama_lengkap)')
      .in('status_booking', ['menunggu_bayar', 'dp'])
      .order('created_at', { ascending: false })

    setPendingBookings(data || [])
  }

  const handleOpenPayModal = () => {
    fetchPendingBookings()
    setShowPayModal(true)
    reset()
  }

  const onSubmitPayment = async (formData) => {
    setSubmitting(true)
    try {
      const booking = pendingBookings.find(b => b.id === formData.booking_id)
      if (!booking) throw new Error('Booking tidak ditemukan')

      // Insert transaksi
      const { error: txError } = await supabase
        .from('transaksi')
        .insert({
          booking_id: formData.booking_id,
          metode_bayar: formData.metode_bayar,
          jumlah_bayar: Number(formData.jumlah_bayar),
          jenis_bayar: formData.jenis_bayar,
          dicatat_oleh: profile.id,
        })

      if (txError) throw txError

      // Update booking status
      const newStatus = formData.jenis_bayar === 'pelunasan' ? 'lunas' : 'dp'
      const { error: bookingError } = await supabase
        .from('booking')
        .update({ status_booking: newStatus })
        .eq('id', formData.booking_id)

      if (bookingError) throw bookingError

      addToast('Pembayaran berhasil dicatat!', 'success')
      setShowPayModal(false)
      reset()
      fetchTransaksi()
    } catch (err) {
      addToast('Gagal mencatat pembayaran: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num)
  }

  const formatDateTime = (dt) => {
    if (!dt) return '-'
    return new Date(dt).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatTime = (time) => time?.slice(0, 5)

  const filteredTransaksi = transaksi.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.booking?.profiles?.nama_lengkap?.toLowerCase().includes(q) ||
      t.booking?.lapangan?.nama?.toLowerCase().includes(q) ||
      t.metode_bayar?.toLowerCase().includes(q)
    )
  })

  const selectedBooking = pendingBookings.find(b => b.id === watch('booking_id'))

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
            Transaksi
          </h2>
          <p style={{ color: 'var(--color-muted-indigo)', fontSize: '0.875rem' }}>
            Catat dan kelola pembayaran
          </p>
        </div>
        <button onClick={handleOpenPayModal} className="btn btn-primary">
          <Plus size={16} />
          Catat Pembayaran
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '320px' }}>
        <Search size={16} style={{
          position: 'absolute', left: '0.75rem', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--color-muted-indigo)', opacity: 0.5,
        }} />
        <input
          type="text"
          className="input"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Cari nama, lapangan, metode..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton" style={{ height: '48px' }} />
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna</th>
                <th>Lapangan</th>
                <th>Metode</th>
                <th>Jenis</th>
                <th>Jumlah</th>
                <th>Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-muted-indigo)', padding: '2rem' }}>
                    Belum ada transaksi
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {formatDateTime(t.waktu_bayar)}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {t.booking?.profiles?.nama_lengkap || '-'}
                    </td>
                    <td>{t.booking?.lapangan?.nama || '-'}</td>
                    <td>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '6px',
                        background: 'var(--color-fog-white)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}>
                        {t.metode_bayar}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.jenis_bayar === 'pelunasan' ? 'badge-available' : 'badge-pending'}`}>
                        {t.jenis_bayar === 'pelunasan' ? 'Pelunasan' : 'DP'}
                      </span>
                    </td>
                    <td style={{
                      fontFamily: 'var(--font-family-display)',
                      fontWeight: 600,
                    }}>
                      {formatCurrency(t.jumlah_bayar)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-muted-indigo)' }}>
                      {t.dicatat_oleh_profile?.nama_lengkap || 'Sistem'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Catat Pembayaran"
      >
        <form onSubmit={handleSubmit(onSubmitPayment)}>
          {/* Booking select */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Pilih Booking</label>
            <select
              className={`select ${errors.booking_id ? 'input-error' : ''}`}
              {...register('booking_id', { required: 'Pilih booking' })}
            >
              <option value="">-- Pilih booking --</option>
              {pendingBookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.profiles?.nama_lengkap} — {b.lapangan?.nama} ({b.tanggal} {formatTime(b.jam_mulai)}) [{b.status_booking}]
                </option>
              ))}
            </select>
            {errors.booking_id && <p className="error-text">{errors.booking_id.message}</p>}
          </div>

          {/* Show booking details */}
          {selectedBooking && (
            <div style={{
              padding: '0.75rem',
              background: 'var(--color-surface-secondary)',
              borderRadius: 'var(--radius-input)',
              marginBottom: '1rem',
              fontSize: '0.8125rem',
            }}>
              <p><strong>Total Harga:</strong> {formatCurrency(selectedBooking.total_harga)}</p>
              <p><strong>Status:</strong> {selectedBooking.status_booking}</p>
            </div>
          )}

          {/* Metode bayar */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Metode Bayar</label>
            <select
              className={`select ${errors.metode_bayar ? 'input-error' : ''}`}
              {...register('metode_bayar', { required: 'Pilih metode' })}
            >
              <option value="">-- Pilih metode --</option>
              <option value="transfer">Transfer Bank</option>
              <option value="tunai">Tunai</option>
              <option value="qris">QRIS</option>
            </select>
            {errors.metode_bayar && <p className="error-text">{errors.metode_bayar.message}</p>}
          </div>

          {/* Jenis bayar */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Jenis Bayar</label>
            <select
              className={`select ${errors.jenis_bayar ? 'input-error' : ''}`}
              {...register('jenis_bayar', { required: 'Pilih jenis' })}
            >
              <option value="">-- Pilih jenis --</option>
              <option value="dp">DP (Uang Muka)</option>
              <option value="pelunasan">Pelunasan</option>
            </select>
            {errors.jenis_bayar && <p className="error-text">{errors.jenis_bayar.message}</p>}
          </div>

          {/* Jumlah */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Jumlah Bayar (Rp)</label>
            <input
              type="number"
              className={`input ${errors.jumlah_bayar ? 'input-error' : ''}`}
              placeholder="Contoh: 150000"
              {...register('jumlah_bayar', {
                required: 'Jumlah wajib diisi',
                min: { value: 1, message: 'Jumlah minimal Rp 1' },
              })}
            />
            {errors.jumlah_bayar && <p className="error-text">{errors.jumlah_bayar.message}</p>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowPayModal(false)} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
