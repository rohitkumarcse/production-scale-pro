const http = require("http");
const mongoose = require("mongoose");

const { connectDB } = require("./database");

const PORT = 3001;
const SERVER_NAME = "server-1";

// ============================================
// MONGODB HEALTH CHECK
// ============================================

async function checkMongoDB() {
  try {
    // Make sure mongoose has an active connection
    if (mongoose.connection.readyState !== 1) {
      return false;
    }

    // Actually communicate with MongoDB
    await mongoose.connection.db.command({
      ping: 1,
    });

    return true;
  } catch (error) {
    console.error(
      `[HEALTH] MongoDB failed: ${error.message}`
    );

    return false;
  }
}

// ============================================
// HTTP SERVER
// ============================================

const server = http.createServer(
  async (req, res) => {

    // ============================================
    // HEALTH CHECK
    // ============================================

    if (req.url === "/health") {
      const mongoHealthy =
        await checkMongoDB();

      console.log(
        `[HEALTH] ${SERVER_NAME} MongoDB=${mongoHealthy}`
      );

      const applicationHealthy =
        mongoHealthy;

      const status =
        applicationHealthy
          ? 200
          : 503;

      res.writeHead(status, {
        "Content-Type":
          "application/json",
      });

      return res.end(
        JSON.stringify({
          status:
            applicationHealthy
              ? "ok"
              : "unhealthy",

          server: SERVER_NAME,

          mongodb:
            mongoHealthy
              ? "ok"
              : "failed",
        })
      );
    }

    // ============================================
    // NORMAL REQUEST
    // ============================================

    const requestId =
      req.headers["x-request-id"] ||
      "unknown";

    console.log(
      `[${SERVER_NAME}] requestId=${requestId} ${req.method} ${req.url}`
    );

    res.writeHead(200, {
      "Content-Type":
        "application/json",
    });

    res.end(
      JSON.stringify({
        server: SERVER_NAME,
        message: "Hello from backend",
        requestId,
      })
    );
  }
);

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(
        `[SERVER] ${SERVER_NAME} running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "[SERVER] Startup failed:",
      error.message
    );

    process.exit(1);
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function shutdown(signal) {
  console.log(
    `[SHUTDOWN] Received ${signal}`
  );

  // Stop accepting new requests
  server.close(async () => {
    console.log(
      "[SHUTDOWN] HTTP server closed"
    );

    try {
      // Close MongoDB connection
      await mongoose.connection.close();

      console.log(
        "[SHUTDOWN] MongoDB connection closed"
      );

      process.exit(0);
    } catch (error) {
      console.error(
        "[SHUTDOWN] MongoDB close failed:",
        error.message
      );

      process.exit(1);
    }
  });
}

// ============================================
// SHUTDOWN SIGNALS
// ============================================

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

// ============================================
// START APPLICATION
// ============================================

startServer();