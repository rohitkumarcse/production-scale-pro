const express = require("express");
const logger = require("./middleware/logger");

const app = express();

app.use(express.json());
app.use(logger);

const SERVER_ID = process.env.SERVER_ID || "unknown";
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Node.js",
    server: SERVER_ID,
    port: PORT
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    server: SERVER_ID
  });
});

module.exports = app;