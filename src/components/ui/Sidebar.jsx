import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  BarChart3,
  MapPin,
  LogOut,
  X,
  CalendarPlus,
  History,
  BookOpen,
} from 'lucide-react'

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/jadwal', icon: CalendarDays, label: 'Jadwal Lapangan' },
  { to: '/admin/transaksi', icon: CreditCard, label: 'Transaksi' },
  { to: '/admin/laporan', icon: BarChart3, label: 'Laporan' },
  { to: '/admin/lapangan', icon: MapPin, label: 'Data Lapangan' },
]

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/booking-baru', icon: CalendarPlus, label: 'Booking Baru' },
  { to: '/dashboard/booking-aktif', icon: BookOpen, label: 'Booking Aktif' },
  { to: '/dashboard/riwayat', icon: History, label: 'Riwayat Booking' },
]

export default function Sidebar({ isAdmin = false, isOpen = false, onClose }) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : userLinks

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 49,
            display: 'none',
          }}
          className="sidebar-overlay"
        />
      )}

      <aside className={`layout-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div style={{
          padding: '0 1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-atlassian-blue), #4c9aff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-family-display)',
            }}>
              SM
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 700,
                fontSize: '0.9375rem',
              }}>
                SM Sport Center
              </div>
              <div style={{
                fontSize: '0.6875rem',
                opacity: 0.5,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {isAdmin ? 'Panel Admin' : 'Dashboard'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.4,
            padding: '0 0.625rem',
            marginBottom: '0.5rem',
          }}>
            Menu
          </div>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                marginBottom: '0.125rem',
                transition: 'all 0.15s ease',
              })}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Profile & sign out */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            marginBottom: '0.125rem',
          }}>
            {profile?.nama_lengkap || 'User'}
          </div>
          <div style={{
            fontSize: '0.6875rem',
            opacity: 0.5,
            marginBottom: '0.75rem',
          }}>
            {profile?.role === 'admin' ? 'Administrator' : 'Pengguna'}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(222,53,11,0.15)'
              e.target.style.borderColor = 'rgba(222,53,11,0.3)'
              e.target.style.color = '#ff8f73'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255,255,255,0.05)'
              e.target.style.borderColor = 'rgba(255,255,255,0.1)'
              e.target.style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-overlay { display: block !important; }
          .sidebar-close-btn { display: block !important; }
        }
      `}</style>
    </>
  )
}
