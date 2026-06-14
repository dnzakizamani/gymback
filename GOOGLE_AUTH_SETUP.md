# 🔐 Google Auth Setup Guide

## Checklist Lengkap untuk Setup Google OAuth

---

## 1️⃣ Google Cloud Console Setup

### Step 1.1: Buat Project
1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Klik **"Select a project"** → **"New Project"**
3. Isi project name: `gym-tracker`
4. Klik **Create**

### Step 1.2: Enable Google+ API
1. Di sidebar → **APIs & Services** → **Library**
2. Search "Google+ API" atau "Identity Toolkit"
3. Klik **Enable**

### Step 1.3: Setup OAuth Consent Screen
1. **APIs & Services** → **OAuth consent screen**
2. Pilih **External** → **Create**
3. Fill in:
   - App name: `Gym Tracker`
   - User support email: (email kamu)
   - Developer contact: (email kamu)
4. Klik **Save and Continue**
5. Skip Scopes (add later if needed) → **Save and Continue**
6. Add test users (optional) → **Save and Continue**

### Step 1.4: Create OAuth Credentials
1. **APIs & Services** → **Credentials**
2. Klik **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Gym Tracker Web Client`
5. **Authorized JavaScript origins:**
   - `http://localhost:3000` (dev)
   - `https://your-domain.com` (prod)
6. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/google/callback` (dev)
   - `https://your-domain.com/api/auth/google/callback` (prod)
7. Klik **Create**
8. Copy **Client ID** dan **Client Secret**

---

## 2️⃣ Backend Setup (Express + Prisma)

> ⚠️ Project ini belum ada backend, jadi kita perlu buat folder `server/`

### Step 2.1: Install Backend Dependencies

```bash
mkdir server && cd server
npm init -y
npm install express cors dotenv prisma @prisma/client jsonwebtoken google-auth-library bcryptjs
npm install --save-dev nodemon
```

### Step 2.2: Update Prisma Schema

Tambahkan field ke model `User`:

```prisma
// schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password_hash String?
  fullName      String?
  isAdmin       Boolean  @default(false)
  googleId      String?  @unique  // ⬅️ Tambahan untuk Google Auth
  avatarUrl     String?           // ⬅️ Tambahan untuk Google Avatar
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userExercises   UserExercise[]
  workoutSessions WorkoutSession[]

  @@map("users")
}
```

Jalankan `npx prisma migrate dev --name add_google_auth`

### Step 2.3: Buat Auth Routes

```javascript
// server/src/routes/auth.js

const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize Google OAuth client
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// GET /api/auth/google - Generate Google OAuth URL
router.get('/google', (req, res) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${process.env.API_URL}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  
  res.json({ url: url.toString() });
});

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: { code: 'MISSING_CODE', message: 'Authorization code required' } 
    });
  }

  try {
    // Exchange code for tokens
    const tokensResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.API_URL}/api/auth/google/callback`,
      }),
    });

    const tokens = await tokensResponse.json();
    
    if (tokens.error) {
      throw new Error(tokens.error_description || 'Failed to get tokens');
    }

    // Get user info from Google
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    const googleUser = await googleResponse.json();
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.id,
          fullName: googleUser.name,
          avatarUrl: googleUser.picture,
          // password_hash tetap null untuk Google users
        },
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
        },
      });
    }

    // Generate JWT for our app
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

module.exports = router;
```

### Step 2.4: Environment Variables

```env
# .env

DATABASE_URL="postgresql://user:password@localhost:5432/gymtracker"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
API_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"
PORT=5000
```

---

## 3️⃣ Frontend Setup (React)

### Step 3.1: Install Package

```bash
npm install @react-oauth/google
```

### Step 3.2: Buat Google Auth Component

```jsx
// src/components/features/GoogleLoginButton.jsx

import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSuccess = async (response) => {
    // Untuk frontend-only approach (kurang aman, tidak direkomendasikan)
    // const token = response.credential;
    
    // Redirect ke backend untuk verify (lebih aman)
    try {
      const res = await fetch('http://localhost:5000/api/auth/google');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to initiate Google login:', error);
    }
  };

  const handleError = (error) => {
    console.error('Google login failed:', error);
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
      useOneTap={false}
      theme="filled_black"
      size="large"
      text="signin_with"
      shape="rectangular"
    />
  );
};

export default GoogleLoginButton;
```

### Step 3.3: Buat Auth Callback Page

```jsx
// src/pages/AuthCallback/AuthCallback.jsx

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Simpan token
      localStorage.setItem('token', token);
      
      // Fetch user data
      fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.data);
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login, setUser]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: 'white'
    }}>
      Signing you in...
    </div>
  );
};

export default AuthCallback;
```

### Step 3.4: Update App.js Routes

```jsx
// src/App.js - Tambahkan route baru

import AuthCallback from './pages/AuthCallback';

function App() {
  // ... existing code ...

  return (
    <Router>
      <Routes>
        {/* ... existing routes ... */}
        
        {/* Tambahkan callback route */}
        <Route 
          path="/auth/callback" 
          element={<AuthCallback />} 
        />
        
        {/* ... existing routes ... */}
      </Routes>
    </Router>
  );
}
```

### Step 3.5: Update Login Page

```jsx
// src/pages/Login/Login.jsx

import GoogleLoginButton from '../../components/features/GoogleLoginButton';
// ... existing imports

const Login = () => {
  // ... existing code ...

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        {/* ... existing fields ... */}
        
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <span style={{ color: '#666' }}>or</span>
        </div>
        
        <GoogleLoginButton />
      </form>
    </AuthLayout>
  );
};
```

---

## 4️⃣ Testing

### Test Flow:
1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm start`
3. Buka `http://localhost:3000/login`
4. Klik "Sign in with Google"
5. Login dengan Google account
6. Redirect ke dashboard

### Debugging Tips:
- Cek console browser untuk error
- Cek network tab untuk request/response
- Pastikan redirect URI di Google Console match dengan backend

---

## 📁 File Structure Akhir

```
gym-tracker/
├── src/
│   ├── components/
│   │   └── features/
│   │       └── GoogleLoginButton.jsx  ⬅️ NEW
│   ├── pages/
│   │   └── AuthCallback/
│   │       └── AuthCallback.jsx       ⬅️ NEW
│   └── ...
├── server/                             ⬅️ NEW (backend folder)
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.js
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma               ⬅️ MODIFIED
│   ├── .env
│   └── package.json
└── GOOGLE_AUTH_SETUP.md                ⬅️ This file
```

---

## ⚠️ Security Notes

1. **Jangan** simpan Google Client Secret di frontend
2. **Jangan** verify Google token di frontend saja
3. **Selalu** verify token di backend sebelum create session
4. Redirect URI harus **exact match** di Google Console
5. Gunakan HTTPS di production

---

## 🔗 Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com)
- [@react-oauth/google Package](https://www.npmjs.com/package/@react-oauth/google)
