const http = require("http");

const PORT = 3004;

const server = http.createServer(
  (req, res) => {
    const requestId =
      req.headers["x-request-id"] ||
      "unknown";

    const startTime = Date.now();

    console.log(
      `[SERVER-3] request=${requestId} ${req.method} ${req.url}`
    );

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        server: "server-3",
        requestId,
        message: "Hello from server 3",
      })
    );

    const duration =
      Date.now() - startTime;

    console.log(
      `[SERVER-4 RESPONSE] request=${requestId} duration=${duration}ms`
    );
  }
);

server.listen(PORT, () => {
  console.log(
    `Server 4 running on port ${PORT}`
  );
});