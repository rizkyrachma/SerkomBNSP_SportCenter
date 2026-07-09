import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import {
  CheckCircle,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
} from 'lucide-react'

const STEPS = [
  { label: 'Jenis' },
  { label: 'Lapangan' },
  { label: 'Tanggal' },
  { label: 'Slot' },
  { label: 'Konfirmasi' },
]

export default function FormBooking() {
  const { profile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Selections
  const [jenis, setJenis] = useState('')
  const [lapanganList, setLapanganList] = useState([])
  const [selectedLapangan, setSelectedLapangan] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Fetch lapangan when jenis changes
  useEffect(() => {
    if (jenis) {
      supabase
        .from('lapangan')
        .select('*')
        .eq('status_aktif', true)
        .eq('jenis', jenis)
        .order('nama')
        .then(({ data }) => setLapanganList(data || []))
    }
  }, [jenis])

  // Fetch slots when lapangan + date selected
  useEffect(() => {
    if (selectedLapangan && selectedDate) {
      fetchSlots()
    }
  }, [selectedLapangan, selectedDate])

  // Realtime subscription for slots
  useEffect(() => {
    if (!selectedLapangan || !selectedDate) return

    const channel = supabase
      .channel('booking-slots')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jadwal_slot',
        },
        (payload) => {
          setSlots(prev =>
            prev.map(slot =>
              slot.id === payload.new.id ? { ...slot, ...payload.new } : slot
            )
          )
          // Jika salah satu slot yang dipilih dibooking orang lain, hapus dari pilihan
          if (payload.new.status !== 'kosong') {
            setSelectedSlots(prev => prev.filter(s => s.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedLapangan, selectedDate])

  const fetchSlots = async () => {
    setSlotsLoading(true)
    const { data } = await supabase
      .from('jadwal_slot')
      .select('*')
      .eq('lapangan_id', selectedLapangan.id)
      .eq('tanggal', selectedDate)
      .order('jam_mulai')

    setSlots(data || [])
    setSlotsLoading(false)
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
      const combined = [...prev, slot].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
      if (isConsecutiveList(combined)) {
        return combined
      } else {
        addToast('Pilihan jam harus berurutan tanpa jeda waktu! Pilihan direset ke jam yang baru diklik.', 'warning')
        return [slot]
      }
    })
  }

  const handleSubmitBooking = async () => {
    if (selectedSlots.length === 0 || !selectedLapangan || !selectedDate) return
    setSubmitting(true)
    try {
      const payloads = selectedSlots.map((slot) => ({
        user_id: profile?.id || 'b88696c3-5210-48eb-96f1-3b27efa14a0d',
        lapangan_id: selectedLapangan.id,
        slot_id: slot.id,
        tanggal: selectedDate,
        jam_mulai: slot.jam_mulai,
        jam_selesai: slot.jam_selesai,
        total_harga: selectedLapangan.harga_per_jam,
        status_booking: 'menunggu_bayar',
      }))

      const { error } = await supabase.from('booking').insert(payloads)

      if (error) {
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          addToast('Salah satu slot jam sudah dibooking oleh pengguna lain. Silakan pilih ulang jam lain.', 'error')
          fetchSlots()
        } else {
          throw error
        }
      } else {
        addToast(`Booking ${selectedSlots.length} jam berhasil dibuat! Silakan lakukan pembayaran.`, 'success')
        setShowConfirm(false)
        navigate('/dashboard/booking-aktif')
      }
    } catch (err) {
      addToast('Gagal membuat booking: ' + (err.message || 'Terjadi kesalahan'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (time) => time?.slice(0, 5)

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const canProceed = () => {
    switch (step) {
      case 0: return !!jenis
      case 1: return !!selectedLapangan
      case 2: return !!selectedDate
      case 3: return selectedSlots.length > 0
      default: return false
    }
  }

  const handleNext = () => {
    if (step === 3) {
      setShowConfirm(true)
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-family-display)',
        fontSize: '1.25rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
      }}>
        Booking Baru
      </h2>

      {/* Steps indicator */}
      <div className="steps" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
              <div className="step-number">
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${i < step ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {/* Step 0: Jenis lapangan */}
        {step === 0 && (
          <div>
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              Pilih Jenis Lapangan
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {['futsal', 'badminton'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setJenis(type)
                    setSelectedLapangan(null)
                    setSelectedSlot(null)
                  }}
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-card)',
                    border: `2px solid ${jenis === type ? 'var(--color-atlassian-blue)' : 'var(--color-border)'}`,
                    background: jenis === type ? 'var(--color-atlassian-blue-light)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-family-display)',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'var(--color-midnight-navy)',
                  }}>
                    Lapangan {type === 'futsal' ? 'Futsal' : 'Badminton'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Pilih lapangan */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <span
                style={{
                  background: jenis === 'futsal' ? '#0052cc' : '#d94f00',
                  color: '#fff',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                }}
              >
                {jenis === 'futsal' ? 'LAPANGAN FUTSAL' : 'LAPANGAN BADMINTON'}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 600,
                margin: 0,
              }}>
                Pilih Lapangan {jenis === 'futsal' ? 'Futsal' : 'Badminton'}
              </h3>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
            }}>
              {lapanganList.map(lap => (
                <button
                  key={lap.id}
                  onClick={() => {
                    setSelectedLapangan(lap)
                    setSelectedSlot(null)
                  }}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-card)',
                    border: `2px solid ${selectedLapangan?.id === lap.id ? 'var(--color-atlassian-blue)' : 'var(--color-border)'}`,
                    background: selectedLapangan?.id === lap.id ? 'var(--color-atlassian-blue-light)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-family-display)',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    marginBottom: '0.375rem',
                  }}>
                    {lap.nama}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-display)',
                    fontWeight: 700,
                    color: 'var(--color-atlassian-blue)',
                  }}>
                    {formatCurrency(lap.harga_per_jam)}
                    <span style={{
                      fontWeight: 400,
                      fontSize: '0.8125rem',
                      color: 'var(--color-muted-indigo)',
                    }}>
                      {' '}/jam
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Pilih tanggal */}
        {step === 2 && (
          <div>
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              Pilih Tanggal
            </h3>
            <input
              type="date"
              className="input"
              style={{ maxWidth: '300px' }}
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value)
                setSelectedSlots([])
              }}
              min={new Date().toISOString().split('T')[0]}
            />
            {selectedDate && (
              <p style={{
                marginTop: '0.75rem',
                color: 'var(--color-muted-indigo)',
                fontSize: '0.875rem',
              }}>
                {formatDate(selectedDate)}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Pilih slot */}
        {step === 3 && (
          <div>
            <h3 style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 600,
              marginBottom: '0.25rem',
            }}>
              Pilih Slot Jam Berurutan
            </h3>
            <p style={{
              color: 'var(--color-muted-indigo)',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
            }}>
              {selectedLapangan?.nama} — {formatDate(selectedDate)}
              {selectedSlots.length > 0 && ` • Terpilih ${selectedSlots.length} Jam`}
            </p>

            {slotsLoading ? (
              <div className="slot-grid">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '60px' }} />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p style={{ color: 'var(--color-muted-indigo)', textAlign: 'center', padding: '2rem' }}>
                Belum ada slot untuk tanggal ini
              </p>
            ) : (
              <div className="slot-grid">
                {slots.map(slot => {
                  const isSelected = selectedSlots.some(s => s.id === slot.id)
                  const selectIndex = selectedSlots.findIndex(s => s.id === slot.id)
                  const isAvailable = slot.status === 'kosong'
                  return (
                    <button
                      key={slot.id}
                      disabled={!isAvailable}
                      onClick={() => handleSlotClick(slot)}
                      className={`slot-item ${
                        isSelected ? '' :
                        isAvailable ? 'slot-kosong' :
                        slot.status === 'maintenance' ? 'slot-maintenance' :
                        'slot-dibooking'
                      }`}
                      style={{
                        border: isSelected ? '2px solid #1868db' : 'none',
                        background: isSelected ? 'linear-gradient(135deg, var(--color-atlassian-blue), #2b7aff)' : undefined,
                        color: isSelected ? '#fff' : undefined,
                      }}
                    >
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        fontFamily: 'var(--font-family-display)',
                      }}>
                        {formatTime(slot.jam_mulai)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                        {isSelected ? `Dipilih #${selectIndex + 1}` :
                         isAvailable ? 'Tersedia' :
                         slot.status === 'maintenance' ? 'Tutup' : 'Terisi'}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.75rem',
      }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          className="btn btn-secondary"
          disabled={step === 0}
        >
          Kembali
        </button>
        <button
          onClick={handleNext}
          className="btn btn-primary"
          disabled={!canProceed()}
        >
          {step === 3 ? 'Konfirmasi Booking' : 'Lanjut'}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Konfirmasi Booking"
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-input)',
          }}>
            <MapPin size={18} style={{ color: 'var(--color-atlassian-blue)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-indigo)' }}>Lapangan</div>
              <div style={{ fontWeight: 600 }}>{selectedLapangan?.nama}</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-input)',
          }}>
            <Calendar size={18} style={{ color: 'var(--color-atlassian-blue)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-indigo)' }}>Tanggal</div>
              <div style={{ fontWeight: 600 }}>{selectedDate && formatDate(selectedDate)}</div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-surface-secondary)',
            borderRadius: 'var(--radius-input)',
          }}>
            <Clock size={18} style={{ color: 'var(--color-atlassian-blue)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-indigo)' }}>
                Waktu ({selectedSlots.length} Jam Berurutan)
              </div>
              <div style={{ fontWeight: 600 }}>
                {formatTime(selectedSlots[0]?.jam_mulai)} – {formatTime(selectedSlots[selectedSlots.length - 1]?.jam_selesai)}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-atlassian-blue)', marginTop: '0.2rem', fontWeight: 600 }}>
                Daftar Slot: {selectedSlots.map((s) => formatTime(s.jam_mulai)).join(', ')}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-atlassian-blue-light)',
            borderRadius: 'var(--radius-input)',
          }}>
            <CreditCard size={18} style={{ color: 'var(--color-atlassian-blue)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-indigo)' }}>
                Total Harga ({selectedSlots.length} Jam)
              </div>
              <div style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'var(--color-atlassian-blue)',
              }}>
                {selectedLapangan && formatCurrency(selectedSlots.length * selectedLapangan.harga_per_jam)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowConfirm(false)} className="btn btn-secondary">
            Batal
          </button>
          <button
            onClick={handleSubmitBooking}
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                Memproses...
              </>
            ) : (
              'Konfirmasi Booking'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
