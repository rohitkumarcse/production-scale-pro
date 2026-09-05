const net = require("net");

function checkServerHealth(server, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    let finished = false;

    const finish = (healthy) => {
      if (finished) {
        return;
      }

      finished = true;

      socket.destroy();

      resolve({
        ...server,
        healthy,
      });
    };

    socket.setTimeout(timeout);

    socket.once("connect", () => {
      finish(true);
    });

    socket.once("timeout", () => {
      finish(false);
    });

    socket.once("error", () => {
      finish(false);
    });

    socket.connect(server.port, server.host);
  });
}

module.exports = {
  checkServerHealth,
};