import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Beranda from './pages/Beranda';
import Reservasi from './pages/Reservasi';
import RiwayatReservasi from './pages/RiwayatReservasi';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Customer Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Beranda />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservasi"
          element={
            <ProtectedRoute>
              <Reservasi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/riwayat"
          element={
            <ProtectedRoute>
              <RiwayatReservasi />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
