import Request from './request.schema.js';

export const startExpiryJob = () => {
  setInterval(async () => {
    const now = new Date();

    const result = await Request.updateMany(
      {
        status: 'pending',
        expiresAt: { $lte: now }
      },
      { $set: { status: 'expired' } }
    );

    if (result.modifiedCount > 0) {
      console.log(`${result.modifiedCount} requests expired at ${now.toISOString()}`);
    }
  }, 60 * 1000);
};
