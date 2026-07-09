import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import { Calendar, Clock, MapPin, XCircle } from 'lucide-react'

export default function BookingAktif() {
  const { profile } = useAuth()
  const { addToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (profile) fetchBookings()
  }, [profile])

  const fetchBookings = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('booking')
      .select('*, lapangan(nama, jenis)')
      .eq('user_id', profile.id)
      .gte('tanggal', today)
      .neq('status_booking', 'batal')
      .order('tanggal')
      .order('jam_mulai')

    if (!error) setBookings(data || [])
    setLoading(false)
  }

  const handleCancel = async () => {
    if (!cancelModal) return
    setCancelling(true)
    try {
      const { error } = await supabase
        .from('booking')
        .update({ status_booking: 'batal' })
        .eq('id', cancelModal.id)

      if (error) throw error
      addToast('Booking berhasil dibatalkan', 'success')
      setCancelModal(null)
      fetchBookings()
    } catch (err) {
      addToast('Gagal membatalkan booking: ' + err.message, 'error')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (time) => time?.slice(0, 5)

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num)
  }

  const statusBadge = (status) => {
    const map = {
      menunggu_bayar: { cls: 'badge-pending', label: 'Menunggu Bayar' },
      dp: { cls: 'badge-pending', label: 'DP' },
      lunas: { cls: 'badge-available', label: 'Lunas' },
    }
    const s = map[status] || { cls: 'badge-full', label: status }
    return <span className={`badge ${s.cls}`}>{s.label}</span>
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-display)',
        fontSize: '1.25rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
      }}>
        Booking Aktif
      </h2>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-card)' }} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--color-muted-indigo)',
        }}>
          <Calendar size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 500 }}>Belum ada booking aktif</p>
          <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Buat booking baru untuk memulai
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bookings.map(booking => (
            <div key={booking.id} className="card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  <MapPin size={14} style={{ color: 'var(--color-atlassian-blue)' }} />
                  <span style={{
                    fontFamily: 'var(--font-family-display)',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                  }}>
                    {booking.lapangan?.nama || 'Lapangan'}
                  </span>
                  {statusBadge(booking.status_booking)}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-muted-indigo)',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {formatDate(booking.tanggal)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {formatTime(booking.jam_mulai)} – {formatTime(booking.jam_selesai)}
                  </span>
                </div>
                <div style={{
                  marginTop: '0.5rem',
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 600,
                  color: 'var(--color-atlassian-blue)',
                }}>
                  {formatCurrency(booking.total_harga)}
                </div>
              </div>

              <button
                onClick={() => setCancelModal(booking)}
                className="btn btn-danger btn-sm"
              >
                <XCircle size={14} />
                Batalkan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Batalkan Booking?"
      >
        <p style={{
          color: 'var(--color-muted-indigo)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}>
          Apakah Anda yakin ingin membatalkan booking di{' '}
          <strong>{cancelModal?.lapangan?.nama}</strong> pada{' '}
          <strong>{cancelModal && formatDate(cancelModal.tanggal)}</strong>?
          Slot akan kembali tersedia untuk pengguna lain.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setCancelModal(null)}
            className="btn btn-secondary"
          >
            Kembali
          </button>
          <button
            onClick={handleCancel}
            className="btn btn-danger"
            disabled={cancelling}
          >
            {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
