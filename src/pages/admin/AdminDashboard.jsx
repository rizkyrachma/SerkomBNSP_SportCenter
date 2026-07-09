import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CalendarDays,
  DollarSign,
  BarChart3,
  XCircle,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    bookingHariIni: 0,
    pendapatanHariIni: 0,
    okupansi: 0,
    dibatalkan: 0,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentBookings()
  }, [])

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Booking hari ini (bukan batal)
      const { count: bookingCount } = await supabase
        .from('booking')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', today)
        .neq('status_booking', 'batal')

      // Pendapatan hari ini
      const { data: transaksiData } = await supabase
        .from('transaksi')
        .select('jumlah_bayar, waktu_bayar')

      const pendapatanHariIni = (transaksiData || [])
        .filter(t => t.waktu_bayar?.startsWith(today))
        .reduce((sum, t) => sum + Number(t.jumlah_bayar), 0)

      // Okupansi: slot dibooking / total slot hari ini
      const { count: totalSlots } = await supabase
        .from('jadwal_slot')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', today)

      const { count: bookedSlots } = await supabase
        .from('jadwal_slot')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', today)
        .eq('status', 'dibooking')

      const okupansi = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0

      // Booking dibatalkan hari ini
      const { count: cancelCount } = await supabase
        .from('booking')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', today)
        .eq('status_booking', 'batal')

      setStats({
        bookingHariIni: bookingCount || 0,
        pendapatanHariIni,
        okupansi,
        dibatalkan: cancelCount || 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from('booking')
      .select('*, lapangan(nama), profiles(nama_lengkap)')
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentBookings(data || [])
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short',
    })
  }

  const formatTime = (time) => time?.slice(0, 5)

  const statusBadge = (status) => {
    const map = {
      menunggu_bayar: { cls: 'badge-pending', label: 'Menunggu' },
      dp: { cls: 'badge-pending', label: 'DP' },
      lunas: { cls: 'badge-available', label: 'Lunas' },
      batal: { cls: 'badge-full', label: 'Batal' },
    }
    const s = map[status] || { cls: '', label: status }
    return <span className={`badge ${s.cls}`}>{s.label}</span>
  }

  const kpiCards = [
    {
      icon: CalendarDays,
      label: 'Booking Hari Ini',
      value: stats.bookingHariIni,
      color: '#1868db',
      bg: '#e6effa',
    },
    {
      icon: DollarSign,
      label: 'Pendapatan Hari Ini',
      value: formatCurrency(stats.pendapatanHariIni),
      color: '#36b37e',
      bg: '#e3fcef',
    },
    {
      icon: BarChart3,
      label: 'Okupansi Lapangan',
      value: `${stats.okupansi}%`,
      color: '#fca700',
      bg: '#fff7e6',
    },
    {
      icon: XCircle,
      label: 'Dibatalkan',
      value: stats.dibatalkan,
      color: '#de350b',
      bg: '#ffebe6',
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.25rem',
        }}>
          Dashboard Admin
        </h1>
        <p style={{
          color: 'var(--color-muted-indigo)',
          fontSize: '0.9375rem',
        }}>
          Ringkasan aktivitas hari ini
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {kpiCards.map((card, i) => (
          <div key={i} className="kpi-card">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div className="kpi-icon" style={{ background: card.bg, color: card.color }}>
                <card.icon size={20} />
              </div>
              <ArrowUpRight size={16} style={{ color: card.color, opacity: 0.5 }} />
            </div>
            <div className="kpi-value" style={{ color: card.color }}>
              {loading ? '...' : card.value}
            </div>
            <div className="kpi-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card">
        <h3 style={{
          fontFamily: 'var(--font-family-display)',
          fontWeight: 600,
          fontSize: '1rem',
          marginBottom: '1rem',
        }}>
          Booking Terbaru
        </h3>

        {recentBookings.length === 0 ? (
          <p style={{
            color: 'var(--color-muted-indigo)',
            textAlign: 'center',
            padding: '2rem',
          }}>
            Belum ada booking
          </p>
        ) : (
          <div className="table-wrap" style={{ boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Lapangan</th>
                  <th>Tanggal</th>
                  <th>Jam</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {b.profiles?.nama_lengkap || '-'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{b.lapangan?.nama || '-'}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(b.tanggal)}</td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {formatTime(b.jam_mulai)} – {formatTime(b.jam_selesai)}
                    </td>
                    <td>{statusBadge(b.status_booking)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
