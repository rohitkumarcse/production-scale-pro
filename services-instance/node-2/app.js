const http = require("http");

const PORT = 3002;

const server = http.createServer(
  (req, res) => {
    const requestId =
      req.headers["x-request-id"] ||
      "unknown";

    const startTime = Date.now();

    console.log(
      `[SERVER-2] request=${requestId} ${req.method} ${req.url}`
    );

    // ============================================
    // CRASH ENDPOINT (chaos testing)
    // ============================================
    // PID 1 can't be signalled from `docker exec` —
    // the kernel drops signals the init process has
    // no handler for, and blocks SIGKILL entirely
    // from inside the namespace. So the process has
    // to exit itself to trigger the restart policy.

    if (req.url === "/crash") {
      console.error(
        `[SERVER-2] crash requested id=${requestId}`
      );

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({ crashing: "server-2" })
      );

      // Let the response flush, then die.
      return setTimeout(
        () => process.exit(1),
        50
      );
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        server: "server-2",
        requestId,
        message: "Hello from server 2",
      })
    );

    const duration =
      Date.now() - startTime;

    console.log(
      `[SERVER-2 RESPONSE] request=${requestId} duration=${duration}ms`
    );
  }
);

server.listen(PORT, () => {
  console.log(
    `Server 2 running on port ${PORT}`
  );
});