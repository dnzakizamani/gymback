// ============================================================
// AUTH CALLBACK PAGE - Copy ke frontend kamu
// src/pages/AuthCallback/AuthCallback.jsx
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            console.error('OAuth error:', error);
            setStatus('error');
            setTimeout(() => {
                navigate('/login?error=' + error);
            }, 2000);
            return;
        }

        if (token) {
            // 1. Simpan token ke localStorage
            localStorage.setItem('token', token);

            // 2. Fetch user profile untuk verify token
            fetch('http://localhost:3000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // 3. Simpan user data ke auth store (sesuaikan dengan project kamu)
                        localStorage.setItem('user', JSON.stringify(data.data));
                        setStatus('success');

                        // 4. Redirect ke dashboard setelah 1 detik
                        setTimeout(() => {
                            navigate('/dashboard');
                        }, 1000);
                    } else {
                        throw new Error('Invalid token');
                    }
                })
                .catch(err => {
                    console.error('Auth verification failed:', err);
                    localStorage.removeItem('token');
                    setStatus('error');
                    setTimeout(() => {
                        navigate('/login?error=auth_verification_failed');
                    }, 2000);
                });
        } else {
            // No token, redirect to login
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#1a1a2e',
            color: 'white',
            fontFamily: 'Arial, sans-serif'
        }}>
            {status === 'processing' && (
                <>
                    <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #333',
                        borderTop: '4px solid #e94560',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ marginTop: '20px' }}>Signing you in...</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div style={{ fontSize: '48px' }}>✅</div>
                    <p style={{ marginTop: '20px' }}>Success! Redirecting...</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <div style={{ fontSize: '48px' }}>❌</div>
                    <p style={{ marginTop: '20px' }}>Authentication failed. Redirecting...</p>
                </>
            )}

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default AuthCallback;

// ============================================================
// GOOGLE LOGIN BUTTON - Updated version
// src/components/features/GoogleLoginButton.jsx
// ============================================================

/*
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Call backend untuk dapat Google OAuth URL
      const response = await fetch('http://localhost:3000/api/auth/google');
      const data = await response.json();

      if (data.success && data.data.url) {
        // Redirect ke Google OAuth
        window.location.href = data.data.url;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Google login error:', error);
      navigate('/login?error=google_login_failed');
    }
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: '#fff',
        color: '#000',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
      }}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        width="18"
        height="18"
      />
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;
*/

// ============================================================
// ROUTES SETUP - Tambahkan di App.jsx / Routes.jsx
// ============================================================

/*
import { Routes, Route } from 'react-router-dom';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* ... other routes ... }
    </Routes>
  );
}
*/

// ============================================================
// AUTH STORE EXAMPLE (Zustand / Context)
// src/store/authStore.js
// ============================================================

/*
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => {
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        });
      },
      
      logout: () => {
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false 
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      
      setUser: (user) => {
        set({ user });
      },
      
      // Helper untuk API calls
      getAuthHeader: () => {
        const token = get().token;
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);
*/
