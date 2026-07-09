import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/ui/Navbar'
import Footer from '../../components/ui/Footer'
import Modal from '../../components/ui/Modal'
import {
  Menu,
  CalendarDays,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  Calendar,
} from 'lucide-react'

export default function DashboardUser() {
  const { profile } = useAuth()
  const { addToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isRoot = location.pathname === '/dashboard'

  // Data State
  const [lapanganList, setLapanganList] = useState([])
  const [loadingLapangan, setLoadingLapangan] = useState(true)
  const [filterCabang, setFilterCabang] = useState('semua')
  const [selectedLapangan, setSelectedLapangan] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Booking Modal State
  const [selectedSlots, setSelectedSlots] = useState([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isRoot) {
      fetchLapanganWithSlotsToday()
    }
  }, [isRoot])

  useEffect(() => {
    if (selectedLapangan && selectedDate) {
      fetchSlotsForCourt(selectedLapangan.id, selectedDate)
    }
  }, [selectedLapangan, selectedDate])

  // Realtime subscription untuk slot
  useEffect(() => {
    if (!selectedLapangan || !selectedDate) return

    const channel = supabase
      .channel('dashboard-slots')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jadwal_slot' },
        (payload) => {
          setSlots((prev) =>
            prev.map((slot) =>
              slot.id === payload.new.id ? { ...slot, ...payload.new } : slot
            )
          )
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedLapangan, selectedDate])

  const fetchLapanganWithSlotsToday = async () => {
    setLoadingLapangan(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: laps, error } = await supabase
        .from('lapangan')
        .select('*')
        .eq('status_aktif', true)
        .order('jenis')
        .order('nama')

      if (error) throw error

      // Ambil slot hari ini untuk menghitung ketersediaan
      const { data: allSlots } = await supabase
        .from('jadwal_slot')
        .select('lapangan_id, status')
        .eq('tanggal', today)

      const enriched = (laps || []).map((lap) => {
        const courtSlots = (allSlots || []).filter(
          (s) => s.lapangan_id === lap.id
        )
        const emptyCount = courtSlots.filter((s) => s.status === 'kosong').length
        return {
          ...lap,
          emptySlotsToday: emptyCount,
          isFullToday: courtSlots.length > 0 && emptyCount === 0,
        }
      })

      setLapanganList(enriched)
      if (enriched.length > 0 && !selectedLapangan) {
        setSelectedLapangan(enriched[0])
      }
    } catch (err) {
      console.error('Error fetching lapangan:', err)
    } finally {
      setLoadingLapangan(false)
    }
  }

  const fetchSlotsForCourt = async (lapanganId, tanggal) => {
    setLoadingSlots(true)
    try {
      const { data, error } = await supabase
        .from('jadwal_slot')
        .select('*')
        .eq('lapangan_id', lapanganId)
        .eq('tanggal', tanggal)
        .order('jam_mulai')

      if (error) throw error
      setSlots(data || [])
    } catch (err) {
      console.error('Error fetching slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSelectCourt = (lap) => {
    setSelectedLapangan(lap)
    setSelectedSlots([])
    // Scroll smooth ke bagian jadwal
    const section = document.getElementById('section-jadwal')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
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

  const handleConfirmBooking = async () => {
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
      fetchSlotsForCourt(selectedLapangan.id, selectedDate)
      fetchLapanganWithSlotsToday()
    }
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const formatTime = (time) => time?.slice(0, 5)

  const formatDateLabel = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-secondary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="container-app" style={{ paddingTop: '3rem', paddingBottom: '5rem', width: '100%' }}>
        {isRoot ? (
          <div style={{ width: '100%' }}>
            {/* SECTION 1: PILIH LAPANGAN */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div
                style={{
                  color: 'var(--color-atlassian-blue)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                PILIH LAPANGAN
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  color: 'var(--color-midnight-navy)',
                  marginBottom: '0.75rem',
                }}
              >
                Lapangan yang{' '}
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  tersedia
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: '#fca700',
                      borderRadius: '2px',
                      zIndex: -1,
                    }}
                  />
                </span>{' '}
                hari ini
              </h1>

              <p
                style={{
                  color: 'var(--color-muted-indigo)',
                  fontSize: '0.9375rem',
                  maxWidth: '600px',
                  margin: '0 auto 1.5rem',
                  lineHeight: 1.6,
                }}
              >
                Status diperbarui otomatis setiap ada booking baru masuk, jadi
                kamu nggak akan pesan lapangan yang sudah dipakai orang lain.
              </p>

              {/* Legend indikator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '4px',
                      background: '#36b37e',
                    }}
                  />
                  <span>Tersedia</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '4px',
                      background: '#de350b',
                    }}
                  />
                  <span>Penuh hari ini</span>
                </div>
              </div>

              {/* FILTER LAPANGAN */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '1.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setFilterCabang('semua')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '30px',
                    border: filterCabang === 'semua' ? '2px solid var(--color-atlassian-blue)' : '1px solid var(--color-border)',
                    background: filterCabang === 'semua' ? 'var(--color-atlassian-blue)' : 'var(--color-surface)',
                    color: filterCabang === 'semua' ? '#fff' : 'var(--color-midnight-navy)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Semua Lapangan ({lapanganList.length})
                </button>
                <button
                  onClick={() => setFilterCabang('futsal')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '30px',
                    border: filterCabang === 'futsal' ? '2px solid #0052cc' : '1px solid var(--color-border)',
                    background: filterCabang === 'futsal' ? '#0052cc' : 'var(--color-surface)',
                    color: filterCabang === 'futsal' ? '#fff' : 'var(--color-midnight-navy)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Lapangan Futsal ({lapanganList.filter((l) => l.jenis === 'futsal').length})
                </button>
                <button
                  onClick={() => setFilterCabang('badminton')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '30px',
                    border: filterCabang === 'badminton' ? '2px solid #d94f00' : '1px solid var(--color-border)',
                    background: filterCabang === 'badminton' ? '#d94f00' : 'var(--color-surface)',
                    color: filterCabang === 'badminton' ? '#fff' : 'var(--color-midnight-navy)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Lapangan Badminton ({lapanganList.filter((l) => l.jenis === 'badminton').length})
                </button>
              </div>
            </div>

            {/* DAFTAR LAPANGAN DIPISAH */}
            {loadingLapangan ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '3.5rem',
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: '270px', borderRadius: '16px' }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ marginBottom: '4rem' }}>
                {/* KELOMPOK 1: LAPANGAN FUTSAL */}
                {(filterCabang === 'semua' || filterCabang === 'futsal') && (
                  <div style={{ marginBottom: '3rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.25rem',
                        borderBottom: '2px solid #1868db',
                        paddingBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontFamily: 'var(--font-family-display)',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: 'var(--color-midnight-navy)',
                            margin: 0,
                          }}
                        >
                          LAPANGAN FUTSAL
                        </h2>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-indigo)' }}>
                          Khusus untuk pertandingan bola / futsal
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '1.5rem',
                      }}
                    >
                      {lapanganList
                        .filter((lap) => lap.jenis === 'futsal')
                        .map((lap) => {
                          const isAvailable = lap.emptySlotsToday > 0
                          const isSelected = selectedLapangan?.id === lap.id

                          return (
                            <div
                              key={lap.id}
                              onClick={() => handleSelectCourt(lap)}
                              style={{
                                background: 'var(--color-surface)',
                                borderRadius: '16px',
                                border: isSelected
                                  ? '2px solid #1868db'
                                  : '1px solid var(--color-border)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected
                                  ? '0 12px 28px rgba(24, 104, 219, 0.22)'
                                  : '0 4px 12px rgba(16, 18, 20, 0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <div
                                style={{
                                  background: isAvailable
                                    ? 'linear-gradient(145deg, #10243e 0%, #1c365c 100%)'
                                    : 'linear-gradient(145deg, #1c2128 0%, #2a313c 100%)',
                                  height: '110px',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0.75rem',
                                }}
                              >
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    left: '0.75rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.65rem',
                                    borderRadius: '20px',
                                    background: '#0052cc',
                                    color: '#fff',
                                  }}
                                >
                                  FUTSAL
                                </span>

                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    right: '0.75rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.65rem',
                                    borderRadius: '20px',
                                    background: isAvailable ? '#e3fcef' : '#ffebe6',
                                    color: isAvailable ? '#006644' : '#bf2600',
                                  }}
                                >
                                  {isAvailable ? 'TERSEDIA' : 'PENUH'}
                                </span>

                                <div
                                  style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '20px',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  LAPANGAN FUTSAL
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: '1.25rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  flex: 1,
                                }}
                              >
                                <h3
                                  style={{
                                    fontFamily: 'var(--font-family-display)',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: 'var(--color-midnight-navy)',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  {lap.nama}
                                </h3>

                                <p
                                  style={{
                                    fontSize: '0.75rem',
                                    color: isAvailable ? '#287d55' : '#bf2600',
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                  }}
                                >
                                  {isAvailable
                                    ? `${lap.emptySlotsToday} slot kosong hari ini`
                                    : 'Penuh hari ini'}
                                </p>

                                <div
                                  style={{
                                    fontFamily: 'var(--font-family-display)',
                                    fontWeight: 800,
                                    fontSize: '0.9375rem',
                                    color: 'var(--color-midnight-navy)',
                                    marginBottom: '1rem',
                                  }}
                                >
                                  {formatCurrency(lap.harga_per_jam)}
                                  <span
                                    style={{
                                      fontWeight: 400,
                                      fontSize: '0.75rem',
                                      color: 'var(--color-muted-indigo)',
                                    }}
                                  >
                                    {' '}
                                    / jam
                                  </span>
                                </div>

                                <button
                                  style={{
                                    marginTop: 'auto',
                                    width: '100%',
                                    padding: '0.6rem',
                                    borderRadius: '30px',
                                    border: isAvailable ? 'none' : '1px solid var(--color-border)',
                                    background: isAvailable
                                      ? '#1868db'
                                      : 'transparent',
                                    color: isAvailable ? '#fff' : 'var(--color-muted-indigo)',
                                    fontFamily: 'var(--font-family-display)',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {isAvailable ? 'Pilih Futsal' : 'Penuh'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* KELOMPOK 2: LAPANGAN BADMINTON */}
                {(filterCabang === 'semua' || filterCabang === 'badminton') && (
                  <div style={{ marginBottom: '2rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1.25rem',
                        borderBottom: '2px solid #d94f00',
                        paddingBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontFamily: 'var(--font-family-display)',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: 'var(--color-midnight-navy)',
                            margin: 0,
                          }}
                        >
                          LAPANGAN BADMINTON
                        </h2>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-indigo)' }}>
                          Khusus untuk pertandingan bulutangkis / badminton
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '1.5rem',
                      }}
                    >
                      {lapanganList
                        .filter((lap) => lap.jenis === 'badminton')
                        .map((lap) => {
                          const isAvailable = lap.emptySlotsToday > 0
                          const isSelected = selectedLapangan?.id === lap.id

                          return (
                            <div
                              key={lap.id}
                              onClick={() => handleSelectCourt(lap)}
                              style={{
                                background: 'var(--color-surface)',
                                borderRadius: '16px',
                                border: isSelected
                                  ? '2px solid #d94f00'
                                  : '1px solid var(--color-border)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected
                                  ? '0 12px 28px rgba(217, 79, 0, 0.2)'
                                  : '0 4px 12px rgba(16, 18, 20, 0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <div
                                style={{
                                  background: isAvailable
                                    ? 'linear-gradient(145deg, #381810 0%, #5c281c 100%)'
                                    : 'linear-gradient(145deg, #1c2128 0%, #2a313c 100%)',
                                  height: '110px',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0.75rem',
                                }}
                              >
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    left: '0.75rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.65rem',
                                    borderRadius: '20px',
                                    background: '#d94f00',
                                    color: '#fff',
                                  }}
                                >
                                  BADMINTON
                                </span>

                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    right: '0.75rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.65rem',
                                    borderRadius: '20px',
                                    background: isAvailable ? '#e3fcef' : '#ffebe6',
                                    color: isAvailable ? '#006644' : '#bf2600',
                                  }}
                                >
                                  {isAvailable ? 'TERSEDIA' : 'PENUH'}
                                </span>

                                <div
                                  style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '20px',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  LAPANGAN BADMINTON
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: '1.25rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  flex: 1,
                                }}
                              >
                                <h3
                                  style={{
                                    fontFamily: 'var(--font-family-display)',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: 'var(--color-midnight-navy)',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  {lap.nama}
                                </h3>

                                <p
                                  style={{
                                    fontSize: '0.75rem',
                                    color: isAvailable ? '#287d55' : '#bf2600',
                                    fontWeight: 600,
                                    marginBottom: '0.75rem',
                                  }}
                                >
                                  {isAvailable
                                    ? `${lap.emptySlotsToday} slot kosong hari ini`
                                    : 'Penuh hari ini'}
                                </p>

                                <div
                                  style={{
                                    fontFamily: 'var(--font-family-display)',
                                    fontWeight: 800,
                                    fontSize: '0.9375rem',
                                    color: 'var(--color-midnight-navy)',
                                    marginBottom: '1rem',
                                  }}
                                >
                                  {formatCurrency(lap.harga_per_jam)}
                                  <span
                                    style={{
                                      fontWeight: 400,
                                      fontSize: '0.75rem',
                                      color: 'var(--color-muted-indigo)',
                                    }}
                                  >
                                    {' '}
                                    / jam
                                  </span>
                                </div>

                                <button
                                  style={{
                                    marginTop: 'auto',
                                    width: '100%',
                                    padding: '0.6rem',
                                    borderRadius: '30px',
                                    border: isAvailable ? 'none' : '1px solid var(--color-border)',
                                    background: isAvailable
                                      ? '#d94f00'
                                      : 'transparent',
                                    color: isAvailable ? '#fff' : 'var(--color-muted-indigo)',
                                    fontFamily: 'var(--font-family-display)',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {isAvailable ? 'Pilih Badminton' : 'Penuh'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: CEK KETERSEDIAAN JADWAL */}
            {selectedLapangan && (
              <div
                id="section-jadwal"
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '20px',
                  padding: '2.5rem',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 30px rgba(16, 18, 20, 0.05)',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      background: selectedLapangan.jenis === 'futsal' ? '#0052cc' : '#d94f00',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {selectedLapangan.jenis === 'futsal' ? 'LAPANGAN FUTSAL' : 'LAPANGAN BADMINTON'}
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--color-midnight-navy)',
                    }}
                  >
                    Jadwal {selectedLapangan.nama}
                  </h2>
                  <p style={{ color: 'var(--color-muted-indigo)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Klik slot jam untuk memilih (bisa lebih dari 1 jam berurutan)
                  </p>
                </div>

                {/* Date Picker Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'var(--color-surface-secondary)',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                    }}
                  >
                    <Calendar size={18} style={{ color: 'var(--color-atlassian-blue)' }} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontFamily: 'var(--font-family-display)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'var(--color-midnight-navy)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-muted-indigo)',
                      fontWeight: 500,
                    }}
                  >
                    — {formatDateLabel(selectedDate)}
                  </span>
                </div>

                {/* Slots Grid */}
                {loadingSlots ? (
                  <div className="slot-grid">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton"
                        style={{ height: '70px', borderRadius: '12px' }}
                      />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: 'var(--color-muted-indigo)',
                    }}
                  >
                    <Calendar
                      size={40}
                      style={{ margin: '0 auto 1rem', opacity: 0.3 }}
                    />
                    <p style={{ fontWeight: 600 }}>
                      Belum ada slot untuk tanggal ini
                    </p>
                  </div>
                ) : (
                  <div className="slot-grid">
                    {slots.map((slot) => {
                      const isAvailable = slot.status === 'kosong'
                      const isSelected = selectedSlots.some((s) => s.id === slot.id)
                      const selectIndex = selectedSlots.findIndex((s) => s.id === slot.id)
                      return (
                        <button
                          key={slot.id}
                          disabled={!isAvailable}
                          onClick={() => handleSlotClick(slot)}
                          className={`slot-item ${
                            isSelected
                              ? ''
                              : isAvailable
                              ? 'slot-kosong'
                              : slot.status === 'maintenance'
                              ? 'slot-maintenance'
                              : 'slot-dibooking'
                          }`}
                          style={{
                            border: isSelected ? '2px solid #1868db' : 'none',
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--color-atlassian-blue), #2b7aff)'
                              : undefined,
                            color: isSelected ? '#fff' : undefined,
                            padding: '1rem',
                            borderRadius: '12px',
                            boxShadow: isSelected
                              ? '0 6px 18px rgba(24, 104, 219, 0.4)'
                              : undefined,
                            transform: isSelected ? 'scale(1.02)' : undefined,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--font-family-display)',
                              fontWeight: 700,
                              fontSize: '1rem',
                            }}
                          >
                            {formatTime(slot.jam_mulai)}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              marginTop: '0.2rem',
                            }}
                          >
                            {isSelected
                              ? `✓ Dipilih (#${selectIndex + 1})`
                              : isAvailable
                              ? 'Tersedia'
                              : slot.status === 'maintenance'
                              ? 'Tutup'
                              : 'Terisi'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Sticky Booking Bar ketika ada slot berurutan terpilih */}
                {selectedSlots.length > 0 && (
                  <div
                    style={{
                      position: 'sticky',
                      bottom: '1.5rem',
                      zIndex: 50,
                      marginTop: '2rem',
                      background: 'linear-gradient(135deg, var(--color-midnight-navy) 0%, #1c2636 100%)',
                      color: '#fff',
                      padding: '1.25rem 1.75rem',
                      borderRadius: '16px',
                      boxShadow: '0 12px 36px rgba(16, 18, 20, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#8c9ba5', fontWeight: 600 }}>
                        {selectedLapangan.nama} • {formatDateLabel(selectedDate)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.125rem', fontWeight: 700, marginTop: '0.15rem' }}>
                        {selectedSlots.length} Jam Berurutan ({formatTime(selectedSlots[0]?.jam_mulai)} – {formatTime(selectedSlots[selectedSlots.length - 1]?.jam_selesai)})
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#8c9ba5' }}>Total Tarif ({selectedSlots.length} Jam)</div>
                        <div style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 800, color: '#4c9aff' }}>
                          {formatCurrency(selectedSlots.length * selectedLapangan.harga_per_jam)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedSlots([])}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            padding: '0.65rem 1rem',
                            borderRadius: '24px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => setShowConfirmModal(true)}
                          className="btn btn-primary"
                          style={{
                            borderRadius: '24px',
                            padding: '0.65rem 1.5rem',
                            fontWeight: 700,
                            boxShadow: '0 4px 14px rgba(24, 104, 219, 0.4)',
                          }}
                        >
                          Booking ({selectedSlots.length} Jam) →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Konfirmasi Booking Multi-Jam */}
            <Modal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              title="Konfirmasi Booking Lapangan"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem',
                    background: 'var(--color-surface-secondary)',
                    borderRadius: '12px',
                  }}
                >
                  <MapPin
                    size={20}
                    style={{ color: 'var(--color-atlassian-blue)' }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-muted-indigo)',
                      }}
                    >
                      Lapangan
                    </div>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                      <span>{selectedLapangan?.nama}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: selectedLapangan?.jenis === 'futsal' ? '#0052cc' : '#d94f00',
                          color: '#fff',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '12px',
                          fontWeight: 800,
                        }}
                      >
                        {selectedLapangan?.jenis === 'futsal' ? 'LAPANGAN FUTSAL' : 'LAPANGAN BADMINTON'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem',
                    background: 'var(--color-surface-secondary)',
                    borderRadius: '12px',
                  }}
                >
                  <Clock
                    size={20}
                    style={{ color: 'var(--color-atlassian-blue)' }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-muted-indigo)',
                      }}
                    >
                      Waktu ({selectedSlots.length} Jam Berurutan)
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedDate && formatDateLabel(selectedDate)} (
                      {formatTime(selectedSlots[0]?.jam_mulai)} –{' '}
                      {formatTime(selectedSlots[selectedSlots.length - 1]?.jam_selesai)})
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-atlassian-blue)', marginTop: '0.25rem', fontWeight: 600 }}>
                      Daftar Slot: {selectedSlots.map((s) => formatTime(s.jam_mulai)).join(', ')}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem',
                    background: 'var(--color-atlassian-blue-light)',
                    borderRadius: '12px',
                  }}
                >
                  <CreditCard
                    size={20}
                    style={{ color: 'var(--color-atlassian-blue)' }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-muted-indigo)',
                      }}
                    >
                      Total Tarif ({selectedSlots.length} Jam × {selectedLapangan && formatCurrency(selectedLapangan.harga_per_jam)})
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-display)',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        color: 'var(--color-atlassian-blue)',
                      }}
                    >
                      {selectedLapangan &&
                        formatCurrency(selectedSlots.length * selectedLapangan.harga_per_jam)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Memproses...'
                    : `Konfirmasi Booking (${selectedSlots.length} Jam)`}
                </button>
              </div>
            </Modal>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
