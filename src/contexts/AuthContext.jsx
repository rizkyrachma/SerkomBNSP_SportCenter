import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  // BYPASS AUTH FOR EASY TESTING
  // Default role dari localStorage, jika belum ada gunakan 'admin'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('demo_role') || 'admin'
  })

  const [user, setUser] = useState({
    id: 'b88696c3-5210-48eb-96f1-3b27efa14a0d',
    email: currentRole === 'admin' ? 'admin@smsport.com' : 'user@smsport.com',
  })

  const [profile, setProfile] = useState({
    id: 'b88696c3-5210-48eb-96f1-3b27efa14a0d',
    nama_lengkap: currentRole === 'admin' ? 'Administrator SM (Demo)' : 'Pengguna SM (Demo)',
    no_hp: '081234567890',
    role: currentRole,
  })

  const [loading, setLoading] = useState(false)

  // Fungsi ganti role secara instant untuk kemudahan demo/testing
  const switchDemoRole = (role) => {
    localStorage.setItem('demo_role', role)
    setCurrentRole(role)
    const newUser = {
      id: role === 'admin' ? 'b88696c3-5210-48eb-96f1-3b27efa14a0d' : 'f6ee58d0-1622-4ebd-878e-8554ed298f25',
      email: role === 'admin' ? 'admin@smsport.com' : 'user@smsport.com',
    }
    const newProfile = {
      id: newUser.id,
      nama_lengkap: role === 'admin' ? 'Administrator SM (Demo)' : 'Pengguna SM (Demo)',
      no_hp: '081234567890',
      role: role,
    }
    setUser(newUser)
    setProfile(newProfile)
  }

  const signIn = async () => {
    return { user }
  }

  const signUp = async () => {
    return { user }
  }

  const signOut = async () => {
    // No-op
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: profile?.role === 'admin',
    isAuthenticated: true, // Selalu anggap sudah login
    switchDemoRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
