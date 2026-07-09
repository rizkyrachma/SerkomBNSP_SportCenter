import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { Calendar, Download, BarChart3 } from 'lucide-react'

export default function AdminLaporan() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [okupasiData, setOkupasiData] = useState([])
  const [pendapatanData, setPendapatanData] = useState([])
  const [totalPendapatan, setTotalPendapatan] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [dateFrom, dateTo])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Okupansi per lapangan
      const { data: lapanganData } = await supabase
        .from('lapangan')
        .select('id, nama')
        .eq('status_aktif', true)

      const { data: allSlots } = await supabase
        .from('jadwal_slot')
        .select('lapangan_id, status')
        .gte('tanggal', dateFrom)
        .lte('tanggal', dateTo)

      const okupasi = (lapanganData || []).map(lap => {
        const lapSlots = (allSlots || []).filter(s => s.lapangan_id === lap.id)
        const booked = lapSlots.filter(s => s.status === 'dibooking').length
        const total = lapSlots.length
        return {
          nama: lap.nama,
          okupansi: total > 0 ? Math.round((booked / total) * 100) : 0,
          total,
          booked,
        }
      })
      setOkupasiData(okupasi)

      // Pendapatan per hari
      const { data: transaksiList } = await supabase
        .from('transaksi')
        .select('jumlah_bayar, waktu_bayar')
        .gte('waktu_bayar', dateFrom + 'T00:00:00')
        .lte('waktu_bayar', dateTo + 'T23:59:59')
        .order('waktu_bayar')

      const dailyMap = {}
      let total = 0
      ;(transaksiList || []).forEach(t => {
        const day = t.waktu_bayar?.split('T')[0]
        if (day) {
          dailyMap[day] = (dailyMap[day] || 0) + Number(t.jumlah_bayar)
          total += Number(t.jumlah_bayar)
        }
      })

      const pendapatan = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tanggal, jumlah]) => ({
          tanggal: new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short',
          }),
          pendapatan: jumlah,
        }))

      setPendapatanData(pendapatan)
      setTotalPendapatan(total)
    } catch (err) {
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num)
  }

  const handleExportCSV = () => {
    // Build CSV content
    let csv = 'Lapangan,Okupansi (%),Slot Terisi,Total Slot\n'
    okupasiData.forEach(row => {
      csv += `"${row.nama}",${row.okupansi},${row.booked},${row.total}\n`
    })
    csv += '\n\nTanggal,Pendapatan (Rp)\n'
    pendapatanData.forEach(row => {
      csv += `"${row.tanggal}",${row.pendapatan}\n`
    })
    csv += `\nTotal Pendapatan,${totalPendapatan}\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan_${dateFrom}_${dateTo}.csv`
    link.click()
  }

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: '#fff',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-input)',
        boxShadow: 'var(--shadow-modal)',
        fontSize: '0.8125rem',
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name === 'pendapatan'
              ? formatCurrency(p.value)
              : `${p.value}%`}
          </p>
        ))}
      </div>
    )
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
            Laporan Penggunaan
          </h2>
          <p style={{ color: 'var(--color-muted-indigo)', fontSize: '0.875rem' }}>
            Analisis okupansi dan pendapatan
          </p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-primary">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Date filters */}
      <div className="card" style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-end',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 180px' }}>
          <label className="label">
            <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Dari Tanggal
          </label>
          <input
            type="date"
            className="input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label className="label">
            <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            Sampai Tanggal
          </label>
          <input
            type="date"
            className="input"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div style={{
          padding: '0.625rem 1rem',
          background: 'var(--color-atlassian-blue-light)',
          borderRadius: 'var(--radius-input)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-atlassian-blue)',
        }}>
          Total: {formatCurrency(totalPendapatan)}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-card)' }} />
          <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-card)' }} />
        </div>
      ) : (
        <>
          {/* Okupansi chart */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 600,
              fontSize: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <BarChart3 size={18} style={{ color: 'var(--color-atlassian-blue)' }} />
              Okupansi per Lapangan
            </h3>
            {okupasiData.length === 0 ? (
              <p style={{ color: 'var(--color-muted-indigo)', textAlign: 'center', padding: '2rem' }}>
                Tidak ada data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={okupasiData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                  <XAxis
                    dataKey="nama"
                    tick={{ fontSize: 11, fill: '#42526e' }}
                    tickLine={false}
                    axisLine={{ stroke: '#ebecf0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#42526e' }}
                    tickLine={false}
                    axisLine={{ stroke: '#ebecf0' }}
                    unit="%"
                  />
                  <Tooltip content={customTooltip} />
                  <Bar
                    dataKey="okupansi"
                    name="Okupansi"
                    fill="#1868db"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pendapatan chart */}
          <div className="card">
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 600,
              fontSize: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <BarChart3 size={18} style={{ color: 'var(--color-status-available)' }} />
              Pendapatan Harian
            </h3>
            {pendapatanData.length === 0 ? (
              <p style={{ color: 'var(--color-muted-indigo)', textAlign: 'center', padding: '2rem' }}>
                Tidak ada data transaksi
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pendapatanData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                  <XAxis
                    dataKey="tanggal"
                    tick={{ fontSize: 11, fill: '#42526e' }}
                    tickLine={false}
                    axisLine={{ stroke: '#ebecf0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#42526e' }}
                    tickLine={false}
                    axisLine={{ stroke: '#ebecf0' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={customTooltip} />
                  <Line
                    type="monotone"
                    dataKey="pendapatan"
                    name="pendapatan"
                    stroke="#36b37e"
                    strokeWidth={2.5}
                    dot={{ fill: '#36b37e', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}
