import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { Calendar, Filter, RefreshCw, Lock, Unlock, Zap } from 'lucide-react'

export default function AdminJadwal() {
  const { addToast } = useToast()
  const [lapanganList, setLapanganList] = useState([])
  const [selectedLapangan, setSelectedLapangan] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchLapangan()
  }, [])

  useEffect(() => {
    if (selectedLapangan && selectedDate) {
      fetchSlots()
    }
  }, [selectedLapangan, selectedDate])

  const fetchLapangan = async () => {
    const { data } = await supabase
      .from('lapangan')
      .select('*')
      .eq('status_aktif', true)
      .order('nama')
    setLapanganList(data || [])
    if (data?.length > 0) setSelectedLapangan(data[0].id)
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

  const handleGenerateSlots = async () => {
    setGenerating(true)
    try {
      const { error } = await supabase.rpc('fn_generate_daily_slots', {
        target_date: selectedDate,
      })
      if (error) throw error
      addToast('Slot berhasil di-generate!', 'success')
      fetchSlots()
    } catch (err) {
      addToast('Gagal generate slot: ' + err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleSlot = async (slot) => {
    try {
      const newStatus = slot.status === 'maintenance' ? 'kosong' : 'maintenance'
      const { error } = await supabase
        .from('jadwal_slot')
        .update({ status: newStatus })
        .eq('id', slot.id)
      if (error) throw error
      addToast(
        newStatus === 'maintenance' ? 'Slot diblokir (maintenance)' : 'Slot dibuka kembali',
        'success'
      )
      fetchSlots()
    } catch (err) {
      addToast('Gagal mengubah status slot: ' + err.message, 'error')
    }
  }

  const formatTime = (time) => time?.slice(0, 5)

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
            Jadwal Lapangan
          </h2>
          <p style={{ color: 'var(--color-muted-indigo)', fontSize: '0.875rem' }}>
            Kelola slot jadwal dan maintenance
          </p>
        </div>
        <button
          onClick={handleGenerateSlots}
          className="btn btn-primary"
          disabled={generating}
        >
          {generating ? (
            <>
              <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
              Generating...
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate Slot
            </>
          )}
        </button>
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
            Lapangan
          </label>
          <select
            className="select"
            value={selectedLapangan}
            onChange={e => setSelectedLapangan(e.target.value)}
          >
            {lapanganList.map(lap => (
              <option key={lap.id} value={lap.id}>
                {lap.nama} — {lap.jenis}
              </option>
            ))}
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
          />
        </div>
        <button onClick={fetchSlots} className="btn btn-ghost" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Slots */}
      {loading ? (
        <div className="slot-grid">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '80px' }} />
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
            Klik "Generate Slot" untuk membuat slot
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.5rem',
        }}>
          {slots.map(slot => (
            <div
              key={slot.id}
              className={`card`}
              style={{
                padding: '0.75rem',
                textAlign: 'center',
                background: slot.status === 'kosong' ? 'var(--color-status-available-bg)' :
                  slot.status === 'dibooking' ? 'var(--color-status-full-bg)' :
                  'var(--color-fog-white)',
                border: `1px solid ${
                  slot.status === 'kosong' ? 'var(--color-status-available)' :
                  slot.status === 'dibooking' ? 'var(--color-status-full)' :
                  'var(--color-border)'
                }`,
                borderRadius: 'var(--radius-input)',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: '0.25rem',
              }}>
                {formatTime(slot.jam_mulai)}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                marginBottom: '0.5rem',
                color: slot.status === 'kosong' ? 'var(--color-status-available)' :
                  slot.status === 'dibooking' ? 'var(--color-status-full)' :
                  'var(--color-muted-indigo)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                {slot.status === 'kosong' ? 'Tersedia' :
                 slot.status === 'dibooking' ? 'Dibooking' : 'Maintenance'}
              </div>

              {slot.status !== 'dibooking' && (
                <button
                  onClick={() => handleToggleSlot(slot)}
                  className={`btn btn-sm ${slot.status === 'maintenance' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', fontSize: '0.6875rem' }}
                >
                  {slot.status === 'maintenance' ? (
                    <><Unlock size={12} /> Buka</>
                  ) : (
                    <><Lock size={12} /> Blokir</>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
