const http = require("http");

const loadBalancer = require("./loadBalancer");
const { generateRequestId } = require("./requestId");
const { checkRateLimit} = require("./rateLimiter");


const PORT = 3000;

// ============================================
// KEEP-ALIVE AGENT
// ============================================
// Reuses TCP connections to the backends instead of
// opening a new one per request.

const agent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 64,
});

const server = http.createServer((req, res) => {
  // ============================================
  // REQUEST ID
  // ============================================

  

  const requestId =
    req.headers["x-request-id"] ||
    generateRequestId();

  // Send request ID back to client
  res.setHeader("X-Request-ID", requestId);

  // Start timer
  const startTime = Date.now();

  console.log(
    `[REQUEST] id=${requestId} ${req.method} ${req.url}`
  );

  // ============================================
  // GET HEALTHY SERVER
  // ============================================

  const target =
    loadBalancer.getNextServer();

const ip = req.socket.remoteAddress;
   const rateLimit = checkRateLimit(ip);

// Tell client how many requests are remaining
res.setHeader(
  "X-RateLimit-Remaining",
  rateLimit.remaining
);

if (!rateLimit.allowed) {
  console.log(
    `[RATE LIMIT] id=${requestId} IP=${ip} blocked`
  );

  res.writeHead(429, {
    "Content-Type": "application/json",
    "Retry-After": rateLimit.retryAfter,
  });

  return res.end(
    JSON.stringify({
      error: "Too Many Requests",
      retryAfter: rateLimit.retryAfter,
      requestId,
    })
  );
}

  if (!target) {
    console.error(
      `[LB] id=${requestId} No healthy servers available`
    );

    res.writeHead(503, {
      "Content-Type": "application/json",
    });

    return res.end(
      JSON.stringify({
        error: "Service Unavailable",
        requestId,
      })
    );
  }

  console.log(
    `[LB] id=${requestId} selected ${target.id}:${target.port}`
  );

  // ============================================
  // PROXY REQUEST
  // ============================================

  const options = {
    hostname: target.host,
    port: target.port,
    path: req.url,
    method: req.method,

    agent,

    headers: {
      ...req.headers,

      // Forward request ID to backend
      "x-request-id": requestId,

      // Hop-by-hop header: never forward the client's
      // value, or a "close" from the client would tear
      // down our pooled backend socket.
      connection: "keep-alive",
    },

    timeout: 5000,
  };

  console.log(
    `[PROXY] id=${requestId} forwarding ${req.method} ${req.url} → ${target.id}:${target.port}`
  );

  const proxyRequest = http.request(
    options,
    (proxyResponse) => {
      const duration =
        Date.now() - startTime;

      console.log(
        `[RESPONSE] id=${requestId} server=${target.id} status=${proxyResponse.statusCode} duration=${duration}ms`
      );

      // Forward backend response headers
      res.writeHead(
        proxyResponse.statusCode,
        proxyResponse.headers
      );

      proxyResponse.pipe(res);
    }
  );

  // ============================================
  // TIMEOUT
  // ============================================

  proxyRequest.setTimeout(5000, () => {
    const duration =
      Date.now() - startTime;

    console.error(
      `[PROXY TIMEOUT] id=${requestId} server=${target.id} duration=${duration}ms`
    );

    loadBalancer.markServerUnhealthy(
      target.id
    );

    proxyRequest.destroy();

    if (!res.headersSent) {
      res.writeHead(504, {
        "Content-Type":
          "application/json",
      });

      res.end(
        JSON.stringify({
          error: "Gateway Timeout",
          server: target.id,
          requestId,
        })
      );
    }
  });

  // ============================================
  // ERROR
  // ============================================

  proxyRequest.on(
    "error",
    (error) => {
      const duration =
        Date.now() - startTime;

      console.error(
        `[PROXY ERROR] id=${requestId} server=${target.id} code=${error.code} duration=${duration}ms`
      );

      console.error(
        `[PROXY ERROR MESSAGE] id=${requestId} ${error.message}`
      );

      // A reset on a REUSED pooled socket is the normal
      // keep-alive race: the backend closed an idle socket
      // just as we picked it up. The server is fine — don't
      // pull it out of rotation for this.
      const staleSocket =
        error.code === "ECONNRESET" &&
        proxyRequest.reusedSocket;

      // Mark server unhealthy
      if (
        !staleSocket &&
        (error.code === "ECONNREFUSED" ||
          error.code === "ECONNRESET" ||
          error.code === "ETIMEDOUT")
      ) {
        loadBalancer.markServerUnhealthy(
          target.id
        );
      }

      if (!res.headersSent) {
        res.writeHead(502, {
          "Content-Type":
            "application/json",
        });

        res.end(
          JSON.stringify({
            error: "Bad Gateway",
            server: target.id,
            code: error.code,
            requestId,
          })
        );
      }
    }
  );

  // ============================================
  // FORWARD CLIENT REQUEST
  // ============================================

  req.pipe(proxyRequest);
});

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(
    "================================="
  );

  console.log(
    `LOAD BALANCER RUNNING ON PORT ${PORT}`
  );

  console.log(
    "================================="
  );
});