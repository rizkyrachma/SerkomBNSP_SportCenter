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

    const verifyAdminStatus = async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const userEmail = user.email;
      const userRole = user.app_metadata?.role;

      if (userRole === 'admin' || userRole === 'superadmin' || userEmail?.toLowerCase() === 'admin@smsportcenter.com') {
        setIsAdmin(true);
        return;
      }

      const { data: adminData } = await supabase
        .from('admin')
        .select('role')
        .ilike('email', userEmail)
        .maybeSingle();

      if (mounted) {
        setIsAdmin(Boolean(adminData));
      }
    };

    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(currentSession);
      await verifyAdminStatus(currentSession?.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        await verifyAdminStatus(session?.user);
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
