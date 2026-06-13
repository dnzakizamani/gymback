import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import config from '../config/index.js';
import ApiError from '../utils/ApiError.js';

export const register = async ({ email, password, fullName }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw ApiError.conflict('Email already exists');
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      fullName
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isAdmin: true,
      createdAt: true
    }
  });

  const token = generateToken(user.id);

  return { user, token };
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Check if user registered with Google (no password)
  if (!user.password_hash) {
    throw ApiError.unauthorized('This account was registered with Google. Please use Google Sign-In.');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = generateToken(user.id);

  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

// ============================================================================
// GOOGLE AUTH
// ============================================================================

export const getGoogleAuthUrl = () => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.google.clientId);
  url.searchParams.set('redirect_uri', `${config.google.apiUrl}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'email profile');
  url.searchParams.set('access_type', 'offline');
  // url.searchParams.set('prompt', 'consent');
  url.searchParams.set('prompt', 'select_account');
  
  return url.toString();
};

export const handleGoogleCallback = async (code) => {
  if (!code) {
    throw ApiError.badRequest('Authorization code required');
  }

  // Exchange code for tokens
  const tokensResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${config.google.apiUrl}/api/auth/google/callback`,
    }),
  });

  const tokens = await tokensResponse.json();
  
  if (tokens.error) {
    throw ApiError.badRequest(tokens.error_description || 'Failed to get tokens from Google');
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
    // Create new user with Google info
    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.id,
        fullName: googleUser.name,
        avatarUrl: googleUser.picture,
        // password_hash stays null for Google users
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
  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
    }
  };
};

// ============================================================================
// PROFILE FUNCTIONS
// ============================================================================

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isAdmin: true,
      createdAt: true
    }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

export const updateProfile = async (userId, { fullName }) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { fullName },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isAdmin: true
    }
  });

  return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Check if user is Google user
  if (!user.password_hash) {
    throw ApiError.badRequest('Password cannot be changed for Google accounts');
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isValidPassword) {
    throw ApiError.badRequest('Current password incorrect');
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password_hash }
  });

  return true;
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};
