import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, CalendarDays, LogIn } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { isAuthenticated, isAdmin, signOut, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { to: '/dashboard', label: 'Lapangan' },
    { to: '/jadwal', label: 'Cek Jadwal' },
    { to: '/dashboard/booking-aktif', label: 'Booking Aktif' },
    { to: '/dashboard/riwayat', label: 'Riwayat' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid var(--color-border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container-app" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--color-midnight-navy)',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-atlassian-blue), #4c9aff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 700,
            fontFamily: 'var(--font-family-display)',
          }}>
            SM
          </div>
          <span style={{
            fontFamily: 'var(--font-family-display)',
            fontWeight: 700,
            fontSize: '1.125rem',
          }}>
            Sport Center
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-button)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive(link.to) ? 'var(--color-atlassian-blue)' : 'var(--color-muted-indigo)',
                background: isActive(link.to) ? 'var(--color-atlassian-blue-light)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          {isAdmin && (
            <Link
              to="/admin"
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--color-atlassian-blue)',
                textDecoration: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                background: 'var(--color-atlassian-blue-light)',
              }}
            >
              👑 Panel Admin
            </Link>
          )}

          <Link
            to="/login"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-atlassian-blue)',
              textDecoration: 'none',
              padding: '0.4rem 0.6rem',
            }}
          >
            Masuk
          </Link>

          <Link
            to="/dashboard"
            className="btn btn-primary btn-sm"
            style={{
              borderRadius: '24px',
              padding: '0.5rem 1.25rem',
              fontWeight: 700,
            }}
          >
            Booking Sekarang
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-midnight-navy)',
              padding: '0.25rem',
            }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--color-border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-input)',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive(link.to) ? 'var(--color-atlassian-blue)' : 'var(--color-midnight-navy)',
                background: isActive(link.to) ? 'var(--color-atlassian-blue-light)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
