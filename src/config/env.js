import dotenv from 'dotenv';

dotenv.config();

/**
 * Reads a required variable and fails fast when it is missing, so the process
 * dies at boot with a clear message instead of throwing on the first request.
 */
const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". See .env.example for the full list.`
    );
  }
  return value;
};

const list = (key, fallback = []) => {
  const value = process.env[key];
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || process.env.PORT_NO || 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: list('CORS_ORIGINS', ['http://localhost:3000']),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  // Milliseconds between sweeps of the "expire pending requests" job.
  expiryJobIntervalMs: Number(process.env.EXPIRY_JOB_INTERVAL_MS || 60_000),

  // Public LibreTranslate mirrors the assistant tries, in order.
  translateUrls: list('LIBRETRANSLATE_URLS', [
    'https://libretranslate.de',
    'https://translate.argosopentech.com',
  ]),
};

config.isProduction = config.env === 'production';
config.hasCloudinary = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);

export default config;
