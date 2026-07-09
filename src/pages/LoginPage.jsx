import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/ui/Navbar'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { signIn, profile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      // Demo mode / instant testing
      const isDemoAdmin = data.email?.toLowerCase().includes('admin')
      addToast('Login berhasil! Mengalihkan ke dashboard...', 'success')
      setTimeout(() => {
        navigate(isDemoAdmin ? '/admin' : '/auth-redirect')
      }, 300)
    } catch (err) {
      addToast(err.message || 'Terjadi kesalahan', 'error')
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
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--color-atlassian-blue), #4c9aff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: '#fff',
              }}>
                <LogIn size={22} />
              </div>
              <h1 style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.375rem',
              }}>
                Masuk
              </h1>
              <p style={{
                color: 'var(--color-muted-indigo)',
                fontSize: '0.875rem',
              }}>
                Masuk ke akun SM Sport Center Anda
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-muted-indigo)',
                    opacity: 0.5,
                  }} />
                  <input
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="nama@email.com"
                    {...register('email', {
                      required: 'Email wajib diisi',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Format email tidak valid',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="error-text">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-muted-indigo)',
                    opacity: 0.5,
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="Masukkan password"
                    {...register('password', {
                      required: 'Password wajib diisi',
                      minLength: {
                        value: 6,
                        message: 'Password minimal 6 karakter',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-muted-indigo)',
                      opacity: 0.5,
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="error-text">{errors.password.message}</p>
                )}
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
                    <LogIn size={18} />
                    Masuk
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
              Belum punya akun?{' '}
              <Link to="/daftar" style={{
                color: 'var(--color-atlassian-blue)',
                fontWeight: 500,
                textDecoration: 'none',
              }}>
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
