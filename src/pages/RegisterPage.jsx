import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/ui/Navbar'
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await signUp(data.email, data.password, {
        nama_lengkap: data.nama_lengkap,
        no_hp: data.no_hp,
        role: 'pengguna',
      })
      addToast('Registrasi berhasil! Silakan cek email untuk verifikasi, atau langsung login.', 'success')
      navigate('/login')
    } catch (err) {
      addToast(err.message || 'Terjadi kesalahan saat registrasi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--color-surface-secondary)',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="card" style={{ padding: '2.5rem 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #36b37e, #57d9a3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: '#fff',
              }}>
                <UserPlus size={22} />
              </div>
              <h1 style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.375rem',
              }}>
                Daftar Akun
              </h1>
              <p style={{
                color: 'var(--color-muted-indigo)',
                fontSize: '0.875rem',
              }}>
                Buat akun untuk mulai booking lapangan
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Nama Lengkap */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{
                    position: 'absolute', left: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-muted-indigo)', opacity: 0.5,
                  }} />
                  <input
                    type="text"
                    className={`input ${errors.nama_lengkap ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Masukkan nama lengkap"
                    {...register('nama_lengkap', {
                      required: 'Nama lengkap wajib diisi',
                      minLength: { value: 3, message: 'Nama minimal 3 karakter' },
                    })}
                  />
                </div>
                {errors.nama_lengkap && <p className="error-text">{errors.nama_lengkap.message}</p>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute', left: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-muted-indigo)', opacity: 0.5,
                  }} />
                  <input
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="nama@email.com"
                    {...register('email', {
                      required: 'Email wajib diisi',
                      pattern: { value: /^\S+@\S+$/i, message: 'Format email tidak valid' },
                    })}
                  />
                </div>
                {errors.email && <p className="error-text">{errors.email.message}</p>}
              </div>

              {/* No HP */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Nomor HP</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{
                    position: 'absolute', left: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-muted-indigo)', opacity: 0.5,
                  }} />
                  <input
                    type="tel"
                    className={`input ${errors.no_hp ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="08xxxxxxxxxx"
                    {...register('no_hp', {
                      required: 'Nomor HP wajib diisi',
                      pattern: { value: /^08\d{8,12}$/, message: 'Format nomor HP tidak valid (08...)' },
                    })}
                  />
                </div>
                {errors.no_hp && <p className="error-text">{errors.no_hp.message}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute', left: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-muted-indigo)', opacity: 0.5,
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="Minimal 6 karakter"
                    {...register('password', {
                      required: 'Password wajib diisi',
                      minLength: { value: 6, message: 'Password minimal 6 karakter' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--color-muted-indigo)', opacity: 0.5, padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="error-text">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Daftar
                  </>
                )}
              </button>
            </form>

            <p style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--color-muted-indigo)',
            }}>
              Sudah punya akun?{' '}
              <Link to="/login" style={{
                color: 'var(--color-atlassian-blue)',
                fontWeight: 500,
                textDecoration: 'none',
              }}>
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
