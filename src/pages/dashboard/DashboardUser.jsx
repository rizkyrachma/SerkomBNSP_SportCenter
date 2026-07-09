import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/ui/Navbar'
import Footer from '../../components/ui/Footer'
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
  useEffect(() => {
    if (isRoot) {
      fetchLapanganWithSlotsToday()
    }
  }, [isRoot])

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
    } catch (err) {
      console.error('Error fetching lapangan:', err)
    } finally {
      setLoadingLapangan(false)
    }
  }

  const handleSelectCourt = (lap) => {
    window.scrollTo(0, 0)
    navigate(`/jadwal?lapangan=${lap.id}`)
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num || 0)
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
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  marginBottom: '3.5rem',
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ width: '310px', maxWidth: '100%', height: '270px', borderRadius: '16px' }}
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        borderBottom: '2px solid #1868db',
                        paddingBottom: '0.85rem',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontFamily: 'var(--font-family-display)',
                            fontSize: '1.35rem',
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
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '1.5rem',
                      }}
                    >
                      {lapanganList
                        .filter((lap) => lap.jenis === 'futsal')
                        .map((lap) => {
                          const isAvailable = lap.emptySlotsToday > 0
                          const isSelected = false

                          return (
                            <div
                              key={lap.id}
                              onClick={() => handleSelectCourt(lap)}
                              style={{
                                width: '310px',
                                maxWidth: '100%',
                                flex: '0 0 auto',
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
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        borderBottom: '2px solid #d94f00',
                        paddingBottom: '0.85rem',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontFamily: 'var(--font-family-display)',
                            fontSize: '1.35rem',
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
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '1.5rem',
                      }}
                    >
                      {lapanganList
                        .filter((lap) => lap.jenis === 'badminton')
                        .map((lap) => {
                          const isAvailable = lap.emptySlotsToday > 0
                          const isSelected = false

                          return (
                            <div
                              key={lap.id}
                              onClick={() => handleSelectCourt(lap)}
                              style={{
                                width: '310px',
                                maxWidth: '100%',
                                flex: '0 0 auto',
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
