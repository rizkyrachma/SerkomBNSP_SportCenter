import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(currentSession);
      
      if (currentSession?.user) {
        // In Supabase, role can be set in user metadata or we can query the public.admin table
        const userEmail = currentSession.user.email;
        // Or check user_metadata / app_metadata
        const userRole = currentSession.user.app_metadata?.role;
        
        if (userRole === 'admin' || userRole === 'superadmin') {
          setIsAdmin(true);
        } else {
          // Double check public.admin table for robustness
          const { data: adminData } = await supabase
            .from('admin')
            .select('role')
            .eq('id', currentSession.user.id)
            .maybeSingle();
          
          if (mounted && adminData) {
            setIsAdmin(true);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session?.user) {
          const userRole = session.user.app_metadata?.role;
          if (userRole === 'admin' || userRole === 'superadmin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-shell flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-text border-t-neon-pulse rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login, saving the original location they tried to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Redirect non-admins to home page
    return <Navigate to="/" replace />;
  }

  return children;
}
