import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Pelanggan Pages
import JadwalBooking from './pages/pelanggan/JadwalBooking';
import PemesananReservasi from './pages/pelanggan/PemesananReservasi';
import RiwayatBooking from './pages/pelanggan/RiwayatBooking';
import RiwayatTransaksi from './pages/pelanggan/RiwayatTransaksi';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import KelolaReservasi from './pages/admin/KelolaReservasi';
import KelolaLapangan from './pages/admin/KelolaLapangan';
import LaporanKeuangan from './pages/admin/LaporanKeuangan';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rute Pelanggan */}
              <Route
                path="/pelanggan/jadwal"
                element={
                  <ProtectedRoute allowedRole="pelanggan">
                    <JadwalBooking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pelanggan/pesan/:id"
                element={
                  <ProtectedRoute allowedRole="pelanggan">
                    <PemesananReservasi />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pelanggan/riwayat"
                element={
                  <ProtectedRoute allowedRole="pelanggan">
                    <RiwayatBooking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pelanggan/transaksi"
                element={
                  <ProtectedRoute allowedRole="pelanggan">
                    <RiwayatTransaksi />
                  </ProtectedRoute>
                }
              />

              {/* Rute Admin */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reservasi"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <KelolaReservasi />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/lapangan"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <KelolaLapangan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/keuangan"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <LaporanKeuangan />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
