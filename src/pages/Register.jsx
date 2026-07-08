import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    no_hp: '',
    alamat: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(formData);
      navigate('/pelanggan/jadwal');
    } catch (err) {
      setError(err.message || 'Gagal melakukan pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f0f4fe] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[28px] border border-[#e2e8f0] p-8 shadow-[rgba(20,90,255,0.08)_0px_20px_50px_-12px,rgba(0,0,0,0.05)_0px_4px_12px_-2px]">
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#020520] tracking-tight">
              Daftar Akun <span className="text-[#145aff]">Pelanggan</span>
            </h1>
            <p className="text-xs text-[#6b7280] mt-1">
              Buat akun untuk memesan lapangan futsal & badminton di SM Sport Center
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#fef2f2] border border-[#f87171] flex items-center gap-2.5 text-xs text-[#b91c1c]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="nama"
                required
                value={formData.nama}
                onChange={handleChange}
                placeholder="Rizky Pratama"
                className="w-full px-4 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="email@contoh.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">No. WhatsApp / HP</label>
                <input
                  type="tel"
                  name="no_hp"
                  required
                  value={formData.no_hp}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">Kota / Domisili</label>
                <input
                  type="text"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Jakarta"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#fcfcfc] border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#145aff] focus:ring-2 focus:ring-[#0099ff]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#145aff] text-white font-medium text-sm hover:bg-[#0042e6] disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftar Sekarang'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e2e8f0] text-center text-xs text-[#6b7280]">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-[#145aff] hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
