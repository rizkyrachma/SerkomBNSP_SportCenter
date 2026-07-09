import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import DemoSwitcher from './components/ui/DemoSwitcher'

// Public pages
import LandingPage from './pages/LandingPage'
import JadwalPublik from './pages/JadwalPublik'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// User dashboard
import DashboardUser from './pages/dashboard/DashboardUser'
import BookingAktif from './pages/dashboard/BookingAktif'
import RiwayatBooking from './pages/dashboard/RiwayatBooking'
import FormBooking from './pages/dashboard/FormBooking'

// Admin dashboard
import AdminLayout from './pages/admin/AdminLayout'
import AdminJadwal from './pages/admin/AdminJadwal'
import AdminTransaksi from './pages/admin/AdminTransaksi'
import AdminLaporan from './pages/admin/AdminLaporan'
import AdminLapangan from './pages/admin/AdminLapangan'

// Smart redirect after login based on role
function AuthRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <DemoSwitcher />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/jadwal" element={<JadwalPublik />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/daftar" element={<RegisterPage />} />

            {/* Auth redirect */}
            <Route path="/auth-redirect" element={<AuthRedirect />} />

            {/* User dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardUser />
                </ProtectedRoute>
              }
            >
              <Route path="booking-baru" element={<FormBooking />} />
              <Route path="booking-aktif" element={<BookingAktif />} />
              <Route path="riwayat" element={<RiwayatBooking />} />
            </Route>

            {/* Admin dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="jadwal" element={<AdminJadwal />} />
              <Route path="transaksi" element={<AdminTransaksi />} />
              <Route path="laporan" element={<AdminLaporan />} />
              <Route path="lapangan" element={<AdminLapangan />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
