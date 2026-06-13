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

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = generateToken(user.id);

  const { password_hash, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
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
