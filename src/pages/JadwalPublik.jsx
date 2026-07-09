import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/ui/Navbar'
import { Calendar, Filter } from 'lucide-react'

export default function JadwalPublik() {
  const [lapanganList, setLapanganList] = useState([])
  const [selectedLapangan, setSelectedLapangan] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLapangan()
  }, [])

  useEffect(() => {
    if (selectedLapangan && selectedDate) {
      fetchSlots()
    }
  }, [selectedLapangan, selectedDate])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('jadwal-slot-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jadwal_slot',
        },
        (payload) => {
          // Update local state saat ada perubahan
          if (payload.eventType === 'UPDATE') {
            setSlots(prev =>
              prev.map(slot =>
                slot.id === payload.new.id ? { ...slot, ...payload.new } : slot
              )
            )
          } else if (payload.eventType === 'INSERT') {
            // If the new slot matches current filter, add it
            if (
              payload.new.lapangan_id === selectedLapangan &&
              payload.new.tanggal === selectedDate
            ) {
              setSlots(prev => [...prev, payload.new].sort((a, b) =>
                a.jam_mulai.localeCompare(b.jam_mulai)
              ))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedLapangan, selectedDate])

  const fetchLapangan = async () => {
    const { data } = await supabase
      .from('lapangan')
      .select('*')
      .eq('status_aktif', true)
      .order('jenis')
      .order('nama')

    setLapanganList(data || [])
    if (data?.length > 0) {
      setSelectedLapangan(data[0].id)
    }
    setLoading(false)
  }

  const fetchSlots = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('jadwal_slot')
      .select('*')
      .eq('lapangan_id', selectedLapangan)
      .eq('tanggal', selectedDate)
      .order('jam_mulai')

    setSlots(data || [])
    setLoading(false)
  }

  const selectedLapanganData = lapanganList.find(l => l.id === selectedLapangan)

  const formatTime = (time) => time?.slice(0, 5)

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num || 0)
  }

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) return 'Hari Ini'
    if (date.getTime() === tomorrow.getTime()) return 'Besok'
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const kosongCount = slots.filter(s => s.status === 'kosong').length
  const totalCount = slots.length

  return (
    <div>
      <Navbar />
      <div style={{
        background: 'var(--color-surface-secondary)',
        minHeight: 'calc(100vh - 64px)',
        padding: '2rem 0',
      }}>
        <div className="container-app">
          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.375rem',
            }}>
              Jadwal Lapangan
            </h1>
            <p style={{
              color: 'var(--color-muted-indigo)',
              fontSize: '0.9375rem',
            }}>
              Cek ketersediaan slot secara realtime
            </p>
          </div>

          {/* Filters */}
          <div className="card" style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 250px' }}>
              <label className="label">
                <Filter size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Pilih Lapangan
              </label>
              <select
                className="select"
                value={selectedLapangan}
                onChange={e => setSelectedLapangan(e.target.value)}
              >
                <optgroup label="⚽ CABANG FUTSAL">
                  {lapanganList.filter((lap) => lap.jenis === 'futsal').map((lap) => (
                    <option key={lap.id} value={lap.id}>
                      ⚽ {lap.nama} ({formatCurrency(lap.harga_per_jam)}/jam)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏸 CABANG BADMINTON">
                  {lapanganList.filter((lap) => lap.jenis === 'badminton').map((lap) => (
                    <option key={lap.id} value={lap.id}>
                      🏸 {lap.nama} ({formatCurrency(lap.harga_per_jam)}/jam)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <label className="label">
                <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Tanggal
              </label>
              <input
                type="date"
                className="input"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Slot info */}
          {selectedLapanganData && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div>
                <span style={{
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 600,
                  fontSize: '1rem',
                }}>
                  {selectedLapanganData.nama}
                </span>
                <span style={{
                  color: 'var(--color-muted-indigo)',
                  fontSize: '0.875rem',
                  marginLeft: '0.5rem',
                }}>
                  {getDateLabel(selectedDate)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
                <span className="badge badge-available">{kosongCount} Kosong</span>
                <span className="badge badge-full">{totalCount - kosongCount} Terisi</span>
              </div>
            </div>
          )}

          {/* Slots grid */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.5rem',
            }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '60px' }} />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="card" style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--color-muted-indigo)',
            }}>
              <Calendar size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 500 }}>Belum ada slot untuk tanggal ini</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Slot akan tersedia setelah admin men-generate jadwal
              </p>
            </div>
          ) : (
            <div className="slot-grid">
              {slots.map(slot => (
                <div
                  key={slot.id}
                  className={`slot-item ${
                    slot.status === 'kosong' ? 'slot-kosong' :
                    slot.status === 'maintenance' ? 'slot-maintenance' :
                    'slot-dibooking'
                  }`}
                  title={
                    slot.status === 'kosong' ? 'Slot tersedia' :
                    slot.status === 'maintenance' ? 'Maintenance' :
                    'Sudah dibooking'
                  }
                >
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-family-display)',
                  }}>
                    {formatTime(slot.jam_mulai)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                    {slot.status === 'kosong' ? 'Tersedia' :
                     slot.status === 'maintenance' ? 'Tutup' : 'Terisi'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: 'var(--color-muted-indigo)',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Tersedia', cls: 'slot-kosong' },
              { label: 'Terisi', cls: 'slot-dibooking' },
              { label: 'Maintenance', cls: 'slot-maintenance' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}>
                <div
                  className={`slot-item ${item.cls}`}
                  style={{
                    width: '16px',
                    height: '16px',
                    padding: 0,
                    cursor: 'default',
                    minWidth: '16px',
                  }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
