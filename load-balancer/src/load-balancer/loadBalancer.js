const { checkServerHealth } = require("./healthCheck");

class LoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
    this.healthCheckInterval = 5000;

    this.startHealthChecks();
  }

  async updateHealth() {
    const results = await Promise.all(
      this.servers.map((server) =>
        checkServerHealth(server)
      )
    );

    results.forEach((result) => {
      const server = this.servers.find(
        (s) => s.id === result.id
      );

      if (!server) return;

      const wasHealthy = server.healthy;

      server.healthy = result.healthy;

      if (!wasHealthy && server.healthy) {
        console.log(
          `[HEALTH CHECK] ${server.id}:${server.port} is HEALTHY`
        );
      }

      if (wasHealthy && !server.healthy) {
        console.log(
          `[HEALTH CHECK] ${server.id}:${server.port} is UNHEALTHY`
        );
      }
    });

    console.log(
      "[LB] Healthy servers:",
      this.getHealthyServers().map(
        (server) => server.id
      )
    );
  }

  startHealthChecks() {
    this.updateHealth();

    setInterval(() => {
      this.updateHealth();
    }, this.healthCheckInterval);
  }

  getHealthyServers() {
    return this.servers.filter(
      (server) => server.healthy
    );
  }

  getNextServer() {
    const healthyServers =
      this.getHealthyServers();

    if (healthyServers.length === 0) {
      return null;
    }

    if (
      this.currentIndex >= healthyServers.length
    ) {
      this.currentIndex = 0;
    }

    const server =
      healthyServers[this.currentIndex];

    this.currentIndex =
      (this.currentIndex + 1) %
      healthyServers.length;

    return server;
  }

  markServerUnhealthy(serverId) {
    const server = this.servers.find(
      (s) => s.id === serverId
    );

    if (server) {
      server.healthy = false;

      console.log(
        `[LB] ${server.id}:${server.port} marked UNHEALTHY`
      );
    }
  }
}


// ---------------------------------------------
// BACKEND SERVERS
// ---------------------------------------------

const servers = [
  {
    id: "server-1",
    host: "node-1",
    port: 3001,
    healthy: false,
  },
  {
    id: "server-2",
    host: "node-2",
    port: 3002,
    healthy: false,
  },
  {
    id: "server-3",
    host: "node-3",
    port: 3003,
    healthy: false,
  },
];


// ---------------------------------------------
// CREATE LOAD BALANCER
// ---------------------------------------------

const loadBalancer = new LoadBalancer(
  servers
);

module.exports = loadBalancer;