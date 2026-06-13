import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  databaseUrl: process.env.DATABASE_URL,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};
