const crypto = require("crypto");

function generateRequestId() {
  return crypto.randomUUID();
}

module.exports = {
  generateRequestId,
};