import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Calendar, Clock, MapPin, History } from 'lucide-react'

export default function RiwayatBooking() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('semua')

  useEffect(() => {
    if (profile) fetchBookings()
  }, [profile])

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('booking')
      .select('*, lapangan(nama, jenis)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error) setBookings(data || [])
    setLoading(false)
  }

  const filteredBookings = filterStatus === 'semua'
    ? bookings
    : bookings.filter(b => b.status_booking === filterStatus)

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
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
      batal: { cls: 'badge-full', label: 'Dibatalkan' },
    }
    const s = map[status] || { cls: '', label: status }
    return <span className={`badge ${s.cls}`}>{s.label}</span>
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
        <h2 style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
        }}>
          Riwayat Booking
        </h2>

        <select
          className="select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="semua">Semua Status</option>
          <option value="menunggu_bayar">Menunggu Bayar</option>
          <option value="dp">DP</option>
          <option value="lunas">Lunas</option>
          <option value="batal">Dibatalkan</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-card)' }} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--color-muted-indigo)',
        }}>
          <History size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 500 }}>Belum ada riwayat booking</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Lapangan</th>
                <th>Tanggal</th>
                <th>Jam</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <MapPin size={14} style={{ color: 'var(--color-atlassian-blue)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                          {booking.lapangan?.nama}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-muted-indigo)',
                          textTransform: 'capitalize',
                        }}>
                          {booking.lapangan?.jenis}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem' }}>
                      {formatDate(booking.tanggal)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem' }}>
                      {formatTime(booking.jam_mulai)} – {formatTime(booking.jam_selesai)}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-family-display)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}>
                      {formatCurrency(booking.total_harga)}
                    </span>
                  </td>
                  <td>{statusBadge(booking.status_booking)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
