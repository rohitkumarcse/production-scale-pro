const clients = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute

// Effectively disabled so load tests measure the balancer
// rather than the limiter. Set to 100 for real rate limiting.
const MAX_REQUESTS = 100000000000;

function checkRateLimit(clientId) {
  const now = Date.now();

  const client = clients.get(clientId);

  // --------------------------------
  // First request from this client
  // --------------------------------
  if (!client) {
    clients.set(clientId, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
    };
  }

  // --------------------------------
  // Check if window has expired
  // --------------------------------
  if (now - client.windowStart >= WINDOW_MS) {
    // Start a new window
    clients.set(clientId, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
    };
  }

  // --------------------------------
  // Rate limit exceeded
  // --------------------------------
  if (client.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil(
      (WINDOW_MS - (now - client.windowStart)) / 1000
    );

    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  // --------------------------------
  // Increment request count
  // --------------------------------
  client.count++;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - client.count,
  };
}

module.exports = {
  checkRateLimit,
};