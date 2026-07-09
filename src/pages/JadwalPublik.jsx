import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import Modal from '../components/ui/Modal'
import { Calendar, Filter, MapPin } from 'lucide-react'

export default function JadwalPublik() {
  const { isAuthenticated, profile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const lapanganParam = searchParams.get('lapangan')

  const [lapanganList, setLapanganList] = useState([])
  const [selectedLapangan, setSelectedLapangan] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  // Booking State
  const [selectedSlots, setSelectedSlots] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchLapangan()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (lapanganParam && lapanganList.length > 0) {
      const matched = lapanganList.find(item => item.id === lapanganParam)
      if (matched) {
        setSelectedLapangan(matched.id)
      }
    }
  }, [lapanganParam, lapanganList])

  useEffect(() => {
    if (selectedLapangan && selectedDate) {
      setSelectedSlots([])
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
      const matched = lapanganParam && data.find(item => item.id === lapanganParam)
      setSelectedLapangan(matched ? matched.id : data[0].id)
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

  const isConsecutiveList = (list) => {
    if (list.length <= 1) return true
    const sorted = [...list].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].jam_selesai !== sorted[i + 1].jam_mulai) {
        return false
      }
    }
    return true
  }

  const handleSlotClick = (slot) => {
    if (slot.status !== 'kosong') return

    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.id === slot.id)
      if (exists) {
        const filtered = prev.filter((s) => s.id !== slot.id)
        if (filtered.length <= 1 || isConsecutiveList(filtered)) {
          return filtered
        } else {
          return [slot]
        }
      }

      const combined = [...prev, slot].sort((a, b) =>
        a.jam_mulai.localeCompare(b.jam_mulai)
      )
      if (isConsecutiveList(combined)) {
        return combined
      } else {
        addToast(
          'Pilihan jam harus berurutan tanpa jeda waktu! Pilihan direset ke jam yang baru diklik.',
          'warning'
        )
        return [slot]
      }
    })
  }

  const handleProceedBooking = () => {
    if (selectedSlots.length === 0) return
    if (!isAuthenticated) {
      addToast('Silakan login terlebih dahulu untuk melakukan booking', 'warning')
      navigate('/login')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmBooking = async () => {
    if (selectedSlots.length === 0 || !selectedLapangan || !selectedDate) return
    setSubmitting(true)
    try {
      const payloads = selectedSlots.map((slot) => ({
        user_id: profile?.id || 'b88696c3-5210-48eb-96f1-3b27efa14a0d',
        lapangan_id: selectedLapangan,
        slot_id: slot.id,
        tanggal: selectedDate,
        jam_mulai: slot.jam_mulai,
        jam_selesai: slot.jam_selesai,
        total_harga: selectedLapanganData?.harga_per_jam || 150000,
        status_booking: 'menunggu_bayar',
      }))

      const { error } = await supabase.from('booking').insert(payloads)

      if (error) {
        if (
          error.code === '23505' ||
          error.message?.includes('unique') ||
          error.message?.includes('duplicate')
        ) {
          addToast(
            'Salah satu slot jam baru saja dipesan orang lain. Silakan pilih ulang jam lain.',
            'error'
          )
        } else {
          throw error
        }
      } else {
        addToast(
          `Booking berhasil dibuat untuk ${selectedSlots.length} jam berurutan! Silakan lakukan pembayaran.`,
          'success'
        )
        setShowConfirmModal(false)
        setSelectedSlots([])
        navigate('/dashboard/booking-aktif')
      }
    } catch (err) {
      addToast('Gagal booking: ' + (err.message || 'Terjadi kesalahan'), 'error')
    } finally {
      setSubmitting(false)
      fetchSlots()
    }
  }

  const kosongCount = slots.filter(s => s.status === 'kosong').length
  const totalCount = slots.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
                <optgroup label="LAPANGAN FUTSAL">
                  {lapanganList.filter((lap) => lap.jenis === 'futsal').map((lap) => (
                    <option key={lap.id} value={lap.id}>
                      {lap.nama} ({formatCurrency(lap.harga_per_jam)}/jam)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="LAPANGAN BADMINTON">
                  {lapanganList.filter((lap) => lap.jenis === 'badminton').map((lap) => (
                    <option key={lap.id} value={lap.id}>
                      {lap.nama} ({formatCurrency(lap.harga_per_jam)}/jam)
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
              {slots.map(slot => {
                const isSelected = selectedSlots.some(s => s.id === slot.id)
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    className={`slot-item ${
                      isSelected ? 'slot-selected' :
                      slot.status === 'kosong' ? 'slot-kosong' :
                      slot.status === 'maintenance' ? 'slot-maintenance' :
                      'slot-dibooking'
                    }`}
                    style={{
                      cursor: slot.status === 'kosong' ? 'pointer' : 'not-allowed',
                      border: isSelected ? '2px solid #1868db' : undefined,
                      boxShadow: isSelected ? '0 0 0 3px rgba(24, 104, 219, 0.22)' : undefined,
                      transform: isSelected ? 'translateY(-2px)' : undefined,
                      background: isSelected ? 'rgba(24, 104, 219, 0.12)' : undefined,
                    }}
                    title={
                      slot.status === 'kosong' ? 'Klik untuk memilih jam ini' :
                      slot.status === 'maintenance' ? 'Maintenance' :
                      'Sudah dibooking'
                    }
                  >
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-family-display)',
                      color: isSelected ? '#1868db' : undefined,
                    }}>
                      {formatTime(slot.jam_mulai)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', opacity: 0.9, fontWeight: isSelected ? 700 : 400 }}>
                      {isSelected ? 'Dipilih' :
                       slot.status === 'kosong' ? 'Tersedia' :
                       slot.status === 'maintenance' ? 'Tutup' : 'Terisi'}
                    </div>
                  </div>
                )
              })}
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
              { label: 'Tersedia', cls: 'slot-kosong', style: {} },
              { label: 'Dipilih', cls: '', style: { border: '2px solid #1868db', background: 'rgba(24, 104, 219, 0.12)' } },
              { label: 'Terisi', cls: 'slot-dibooking', style: {} },
              { label: 'Maintenance', cls: 'slot-maintenance', style: {} },
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
                    borderRadius: '4px',
                    ...item.style,
                  }}
                />
                {item.label}
              </div>
            ))}
          </div>

          {/* Booking Bar jika ada slot dipilih */}
          {selectedSlots.length > 0 && (
            <div
              style={{
                marginTop: '2rem',
                padding: '1.25rem 1.75rem',
                background: 'var(--color-surface)',
                borderRadius: '16px',
                border: '2px solid #1868db',
                boxShadow: '0 8px 24px rgba(24, 104, 219, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: 'var(--color-midnight-navy)', fontSize: '1.1rem', fontFamily: 'var(--font-family-display)' }}>
                  {selectedSlots.length} Jam Dipilih ({selectedLapanganData?.nama || 'Lapangan'})
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-muted-indigo)', marginTop: '0.2rem' }}>
                  Total: <strong style={{ color: '#1868db' }}>{formatCurrency(selectedSlots.length * (selectedLapanganData?.harga_per_jam || 150000))}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setSelectedSlots([])}
                  style={{
                    borderRadius: '30px',
                    padding: '0.65rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleProceedBooking}
                  style={{
                    borderRadius: '30px',
                    padding: '0.65rem 1.5rem',
                    background: '#1868db',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(24, 104, 219, 0.3)',
                  }}
                >
                  {isAuthenticated ? 'Booking Sekarang' : 'Login untuk Booking'}
                </button>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Booking */}
          <Modal
            isOpen={showConfirmModal}
            onClose={() => !submitting && setShowConfirmModal(false)}
            title="Konfirmasi Booking"
          >
            <div style={{ padding: '0.5rem 0' }}>
              <div
                style={{
                  background: 'var(--color-surface-secondary)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted-indigo)' }}>
                  Lapangan Pilihan
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-midnight-navy)', marginTop: '0.25rem' }}>
                  {selectedLapanganData?.nama || 'Lapangan'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted-indigo)', marginTop: '0.75rem' }}>
                  Tanggal Booking
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-midnight-navy)' }}>
                  {selectedDate}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                  Detail Jam ({selectedSlots.length} Jam Berurutan)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedSlots.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {formatTime(s.jam_mulai)} - {formatTime(s.jam_selesai)}
                      </span>
                      <span style={{ fontWeight: 700, color: '#1868db' }}>
                        {formatCurrency(selectedLapanganData?.harga_per_jam || 150000)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--color-border)',
                  marginBottom: '1.5rem',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>Total Pembayaran</span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1868db' }}>
                  {formatCurrency(selectedSlots.length * (selectedLapanganData?.harga_per_jam || 150000))}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  style={{
                    borderRadius: '30px',
                    padding: '0.65rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                  style={{
                    borderRadius: '30px',
                    padding: '0.65rem 1.5rem',
                    background: '#1868db',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Booking'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
      <Footer />
    </div>
  )
}
