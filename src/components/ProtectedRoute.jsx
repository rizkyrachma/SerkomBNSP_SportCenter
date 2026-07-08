import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#145aff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#6b7280]">Memuat sesi pengguna...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Jika user punya role yang berbeda, redirect sesuai rolenya
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/pelanggan/jadwal" replace />;
    }
  }

  return children;
}
