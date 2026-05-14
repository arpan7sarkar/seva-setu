const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => {
  console.error('[RedisService] Connection Error:', err.message);
});

/**
 * Get bot session from Redis
 * @param {string} phoneNumber 
 */
const getBotSession = async (phoneNumber) => {
  const data = await redis.get(`bot_session:${phoneNumber}`);
  return data ? JSON.parse(data) : null;
};

/**
 * Save bot session to Redis with 1-hour expiration
 * @param {string} phoneNumber 
 * @param {object} sessionData 
 */
const saveBotSession = async (phoneNumber, sessionData) => {
  // We set an expiry of 1 hour for bot sessions to keep Redis clean
  await redis.set(
    `bot_session:${phoneNumber}`, 
    JSON.stringify(sessionData), 
    'EX', 
    3600 
  );
};

/**
 * Delete bot session
 * @param {string} phoneNumber 
 */
const deleteBotSession = async (phoneNumber) => {
  await redis.del(`bot_session:${phoneNumber}`);
};

module.exports = {
  getBotSession,
  saveBotSession,
  deleteBotSession
};
