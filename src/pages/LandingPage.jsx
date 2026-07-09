import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/ui/Footer'
import {
  ShieldCheck,
  Zap,
  Monitor,
  CalendarDays,
  MapPin,
  Clock,
  ArrowRight,
  Star,
  Users,
  Trophy,
} from 'lucide-react'

export default function LandingPage() {
  const [lapangan, setLapangan] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLapangan()
  }, [])

  const fetchLapangan = async () => {
    try {
      const { data, error } = await supabase
        .from('lapangan')
        .select('*')
        .eq('status_aktif', true)
        .order('jenis')
        .order('nama')

      if (error) throw error
      setLapangan(data || [])
    } catch (err) {
      console.error('Error fetching lapangan:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num)
  }

  const features = [
    {
      icon: ShieldCheck,
      title: 'Anti Double Booking',
      desc: 'Sistem constraint di database memastikan satu slot hanya bisa dipesan oleh satu pengguna.',
      color: '#36b37e',
      bg: '#e3fcef',
    },
    {
      icon: Zap,
      title: 'Realtime Update',
      desc: 'Ketersediaan lapangan update otomatis di semua perangkat tanpa perlu refresh.',
      color: '#1868db',
      bg: '#e6effa',
    },
    {
      icon: Monitor,
      title: 'Pencatatan Otomatis',
      desc: 'Semua transaksi tercatat rapi. Laporan penggunaan lapangan tinggal cetak.',
      color: '#fca700',
      bg: '#fff7e6',
    },
  ]

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-midnight-navy) 0%, #1a1f25 100%)',
        color: '#fff',
        padding: '5rem 0 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(24,104,219,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(252,167,0,0.1) 0%, transparent 70%)',
        }} />

        <div className="container-app" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            maxWidth: '680px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 1rem',
              borderRadius: 'var(--radius-button)',
              background: 'rgba(252,167,0,0.15)',
              color: 'var(--color-taxicab-yellow)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}>
              <Star size={14} />
              Reservasi Online #1 di Kota
            </div>

            <h1 style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '1.25rem',
            }}>
              Booking Lapangan
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #4c9aff, #1868db)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Tanpa Ribet
              </span>
            </h1>

            <p style={{
              fontSize: '1.125rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '2rem',
              maxWidth: '520px',
            }}>
              SM Sport Center menyediakan lapangan futsal dan badminton berkualitas.
              Booking online, jadwal realtime, bayar mudah — tidak perlu telepon atau WhatsApp lagi.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/jadwal" className="btn btn-primary btn-lg">
                <CalendarDays size={18} />
                Lihat Jadwal
                <ArrowRight size={16} />
              </Link>
              <Link to="/daftar" className="btn btn-lg" style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                Daftar Sekarang
              </Link>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '2.5rem',
              marginTop: '3rem',
              flexWrap: 'wrap',
            }}>
              {[
                { icon: MapPin, value: `${lapangan.length}+`, label: 'Lapangan' },
                { icon: Users, value: '500+', label: 'Pengguna Aktif' },
                { icon: Trophy, value: '15jam', label: 'Operasional/Hari' },
              ].map((stat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <stat.icon size={18} style={{ opacity: 0.7 }} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-family-display)',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lapangan Section */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}>
              Lapangan Kami
            </h2>
            <p style={{
              color: 'var(--color-muted-indigo)',
              fontSize: '1rem',
              maxWidth: '480px',
              margin: '0 auto',
            }}>
              Tersedia lapangan futsal dan badminton dengan fasilitas lengkap dan harga terjangkau
            </p>
          </div>

          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-card)' }} />
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>
              {lapangan.map(lap => (
                <div key={lap.id} className="card card-hover" style={{
                  overflow: 'hidden',
                  padding: 0,
                }}>
                  {/* Card image placeholder */}
                  <div style={{
                    height: '160px',
                    background: lap.jenis === 'futsal'
                      ? 'linear-gradient(135deg, #1a472a, #2d7a4f)'
                      : 'linear-gradient(135deg, #1a3a5c, #2d6a9f)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      opacity: 0.3,
                    }}>
                      {lap.jenis === 'futsal' ? '⚽' : '🏸'}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                    }}>
                      <span className="badge badge-available">
                        Tersedia
                      </span>
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                    }}>
                      <span style={{
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.625rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                      }}>
                        {lap.jenis}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-family-display)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      marginBottom: '0.5rem',
                    }}>
                      {lap.nama}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.25rem',
                      marginBottom: '1rem',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-family-display)',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: 'var(--color-atlassian-blue)',
                      }}>
                        {formatCurrency(lap.harga_per_jam)}
                      </span>
                      <span style={{
                        fontSize: '0.8125rem',
                        color: 'var(--color-muted-indigo)',
                      }}>
                        /jam
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-muted-indigo)',
                    }}>
                      <Clock size={14} />
                      08:00 – 23:00 WIB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '4rem 0',
        background: 'var(--color-surface-secondary)',
        borderTop: '2px solid var(--color-lavender-wash)',
      }}>
        <div className="container-app">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}>
              Mengapa SM Sport Center?
            </h2>
            <p style={{
              color: 'var(--color-muted-indigo)',
              fontSize: '1rem',
            }}>
              Sistem reservasi modern yang menghilangkan masalah booking manual
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {features.map((feat, i) => (
              <div key={i} className="card card-hover" style={{
                textAlign: 'center',
                padding: '2rem 1.5rem',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: feat.bg,
                  color: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <feat.icon size={24} />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 700,
                  fontSize: '1.125rem',
                  marginBottom: '0.625rem',
                }}>
                  {feat.title}
                </h3>
                <p style={{
                  color: 'var(--color-muted-indigo)',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 0',
        background: 'linear-gradient(135deg, var(--color-atlassian-blue) 0%, #4c9aff 100%)',
        color: '#fff',
        textAlign: 'center',
      }}>
        <div className="container-app">
          <h2 style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}>
            Siap Booking Lapangan?
          </h2>
          <p style={{
            opacity: 0.85,
            marginBottom: '1.5rem',
            fontSize: '1rem',
          }}>
            Daftar sekarang dan nikmati kemudahan reservasi online
          </p>
          <Link to="/daftar" className="btn btn-lg" style={{
            background: '#fff',
            color: 'var(--color-atlassian-blue)',
            fontWeight: 600,
          }}>
            Daftar Gratis
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
