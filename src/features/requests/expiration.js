import Request from './request.schema.js';
import config from '../../config/env.js';

/**
 * Marks pending requests as expired once their deadline passes. Runs on an
 * interval rather than a TTL index because the documents must survive — the
 * dashboard counts expired requests.
 */
export const startExpiryJob = () => {
  const sweep = async () => {
    try {
      const result = await Request.updateMany(
        { status: 'pending', expiresAt: { $lte: new Date() } },
        { $set: { status: 'expired' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[expiry] marked ${result.modifiedCount} request(s) as expired`);
      }
    } catch (error) {
      // Swallow: a failed sweep must not take the process down, the next tick retries.
      console.error('[expiry] sweep failed:', error.message);
    }
  };

  const timer = setInterval(sweep, config.expiryJobIntervalMs);
  timer.unref?.(); // Don't hold the event loop open during tests or shutdown.
  return () => clearInterval(timer);
};

export default startExpiryJob;
