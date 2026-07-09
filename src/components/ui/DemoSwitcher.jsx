import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, User } from 'lucide-react'

export default function DemoSwitcher() {
  const { isAdmin, switchDemoRole } = useAuth()
  const navigate = useNavigate()

  const handleToggle = () => {
    if (isAdmin) {
      switchDemoRole('pengguna')
      navigate('/dashboard')
    } else {
      switchDemoRole('admin')
      navigate('/admin')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-surface)',
        border: '2px solid var(--color-atlassian-blue)',
        borderRadius: '50px',
        padding: '0.4rem 0.8rem',
        boxShadow: '0 8px 24px rgba(24, 104, 219, 0.25)',
        cursor: 'pointer',
        fontFamily: 'var(--font-family-display)',
        fontSize: '0.8125rem',
        fontWeight: 700,
        gap: '0.5rem',
        transition: 'all 0.2s ease',
      }}
      onClick={handleToggle}
      title="Klik untuk pindah mode testing"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          color: isAdmin ? '#1868db' : '#36b37e',
        }}
      >
        {isAdmin ? <ShieldCheck size={18} /> : <User size={18} />}
        <span>{isAdmin ? '👑 Mode: ADMIN' : '👤 Mode: PENGGUNA'}</span>
      </div>
      <div
        style={{
          fontSize: '0.6875rem',
          background: isAdmin ? '#e6effa' : '#e3fcef',
          color: isAdmin ? '#1868db' : '#287d55',
          padding: '0.125rem 0.5rem',
          borderRadius: '20px',
        }}
      >
        Ganti
      </div>
    </div>
  )
}
