import mongoose from 'mongoose';
import config from '../config/env.js';

/**
 * Opens the MongoDB connection. Rejects on failure so the caller can abort
 * start-up rather than serving requests against a database that isn't there.
 */
export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(config.databaseUrl);
  console.log('[db] MongoDB connected');

  mongoose.connection.on('error', (error) => {
    console.error('[db] connection error:', error.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });
};

export const disconnectDB = () => mongoose.connection.close();

export default connectDB;
