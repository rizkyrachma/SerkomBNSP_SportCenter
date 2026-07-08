import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isConfigured, getLocalData, setLocalData } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inisialisasi sesi saat aplikasi dimuat
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      if (isConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (err) {
          console.error("Supabase Auth error:", err);
        }
      } else {
        // Mode Demo: Cek localStorage apakah ada sesi login aktif
        const activeUserId = localStorage.getItem('sm_sport_active_user_id');
        if (activeUserId) {
          const users = getLocalData('users', []);
          const found = users.find(u => u.id === activeUserId);
          if (found) {
            setUser({ id: found.id, email: found.email });
            setProfile(found);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchProfile = async (userId) => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    }
  };

  // Login Function
  const login = async (email, password) => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      await fetchProfile(data.user.id);
      return { user: data.user };
    } else {
      // Demo Mode login
      const users = getLocalData('users', []);
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error('Akun tidak ditemukan. Gunakan admin@smsport.com atau rizky@gmail.com');
      }
      localStorage.setItem('sm_sport_active_user_id', found.id);
      setUser({ id: found.id, email: found.email });
      setProfile(found);
      return { user: { id: found.id, email: found.email }, profile: found };
    }
  };

  // Demo Instant Login (Untuk Pengujian Cepat Prototipe)
  const loginAsDemo = (role) => {
    const users = getLocalData('users', []);
    const found = users.find(u => u.role === role);
    if (found) {
      localStorage.setItem('sm_sport_active_user_id', found.id);
      setUser({ id: found.id, email: found.email });
      setProfile(found);
    }
  };

  // Register Function
  const register = async ({ nama, email, password, no_hp, alamat }) => {
    if (isConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nama, role: 'pelanggan' }
        }
      });
      if (error) throw error;
      return data;
    } else {
      const users = getLocalData('users', []);
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email sudah terdaftar!');
      }
      const newUser = {
        id: 'user-' + Date.now(),
        nama,
        email,
        no_hp: no_hp || '',
        alamat: alamat || '',
        role: 'pelanggan'
      };
      const updatedUsers = [...users, newUser];
      setLocalData('users', updatedUsers);
      localStorage.setItem('sm_sport_active_user_id', newUser.id);
      setUser({ id: newUser.id, email: newUser.email });
      setProfile(newUser);
      return { user: newUser };
    }
  };

  // Logout Function
  const logout = async () => {
    if (isConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sm_sport_active_user_id');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role || null,
      loading,
      isConfigured,
      login,
      loginAsDemo,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
