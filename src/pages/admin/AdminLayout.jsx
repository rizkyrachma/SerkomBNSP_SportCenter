import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/ui/Sidebar'
import { Menu } from 'lucide-react'
import AdminDashboard from './AdminDashboard'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isRoot = location.pathname === '/admin'

  return (
    <div className="layout-dashboard">
      <Sidebar
        isAdmin={true}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="layout-main">
        {/* Mobile header */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }} className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={20} />
          </button>
          <h2 style={{
            fontFamily: 'var(--font-family-display)',
            fontWeight: 700,
            fontSize: '1.125rem',
          }}>
            Admin Panel
          </h2>
        </div>

        {isRoot ? <AdminDashboard /> : <Outlet />}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
