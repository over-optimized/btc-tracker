/**
 * SharedWorker for Bitcoin Price Coordination
 *
 * Provides centralized Bitcoin price fetching across multiple browser tabs to:
 * - Prevent duplicate API requests
 * - Respect CoinGecko rate limits
 * - Share price data across all connected tabs
 * - Handle rate limiting and error states gracefully
 */

class BitcoinPriceWorker {
  constructor() {
    this.clients = new Set();
    this.currentPrice = null;
    this.lastFetch = null;
    this.isRateLimited = false;
    this.rateLimitResetTime = null;
    this.fetchInterval = null;
    this.stats = {
      requests: 0,
      errors: 0,
      rateLimitHits: 0,
      clientCount: 0,
    };

    // Configuration from environment (defaults)
    this.config = {
      apiUrl: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      pollInterval: 5 * 60 * 1000, // 5 minutes
      rateLimitDelay: 60 * 1000, // 1 minute backoff
      maxRetries: 3,
      apiKey: null, // Optional CoinGecko API key
    };

    // Start periodic price updates
    this.startPeriodicUpdates();

    console.log('Bitcoin Price SharedWorker initialized');
  }

  addClient(port) {
    this.clients.add(port);
    this.stats.clientCount = this.clients.size;

    console.log(`Client connected. Total clients: ${this.clients.size}`);

    // Send current price immediately if available
    if (this.currentPrice && this.isCacheValid()) {
      this.sendToClient(port, {
        type: 'price-update',
        payload: {
          price: this.currentPrice.price,
          timestamp: this.currentPrice.timestamp,
        },
      });
    } else {
      // Fetch fresh price for new client
      this.fetchPrice();
    }

    // Send current stats
    this.sendToClient(port, {
      type: 'stats',
      payload: { stats: this.stats },
    });

    // Handle client disconnection
    port.onclose = () => {
      this.clients.delete(port);
      this.stats.clientCount = this.clients.size;
      console.log(`Client disconnected. Total clients: ${this.clients.size}`);

      // Stop polling if no clients
      if (this.clients.size === 0) {
        this.stopPeriodicUpdates();
      }
    };

    // Handle messages from client
    port.onmessage = (event) => {
      this.handleClientMessage(port, event.data);
    };
  }

  handleClientMessage(port, message) {
    const { type, payload } = message;

    switch (type) {
      case 'get-price':
        if (this.currentPrice && this.isCacheValid()) {
          this.sendToClient(port, {
            type: 'price-update',
            payload: {
              price: this.currentPrice.price,
              timestamp: this.currentPrice.timestamp,
            },
          });
        } else {
          this.fetchPrice();
        }
        break;

      case 'force-refresh':
        this.fetchPrice(true);
        break;

      case 'get-stats':
        this.sendToClient(port, {
          type: 'stats',
          payload: { stats: this.stats },
        });
        break;

      case 'connect':
        // Client is confirming connection
        this.sendToClient(port, {
          type: 'connected',
          payload: { clientId: payload?.clientId },
        });
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  async fetchPrice(force = false) {
    // Check if we should skip due to rate limiting
    if (this.isRateLimited && Date.now() < this.rateLimitResetTime) {
      const waitTime = Math.ceil((this.rateLimitResetTime - Date.now()) / 1000);
      this.broadcastError(`Rate limited. Please wait ${waitTime} seconds.`);
      return;
    }

    // Check cache validity unless forced
    if (!force && this.currentPrice && this.isCacheValid()) {
      return;
    }

    try {
      this.stats.requests++;

      // Build request URL
      let url = this.config.apiUrl;
      if (this.config.apiKey) {
        url += `&x_cg_demo_api_key=${this.config.apiKey}`;
      }

      console.log('Fetching Bitcoin price from:', url);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(this.config.apiKey && { 'x-cg-demo-api-key': this.config.apiKey }),
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        this.handleRateLimit(response);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const price = data.bitcoin?.usd;

      if (typeof price !== 'number' || price <= 0) {
        throw new Error('Invalid price data received');
      }

      // Update cache
      this.currentPrice = {
        price,
        timestamp: Date.now(),
        source: 'coingecko',
      };

      this.lastFetch = Date.now();
      this.isRateLimited = false;

      // Broadcast to all clients
      this.broadcast({
        type: 'price-update',
        payload: {
          price,
          timestamp: this.currentPrice.timestamp,
        },
      });

      console.log(`Bitcoin price updated: $${price}`);
    } catch (error) {
      this.stats.errors++;
      console.error('Failed to fetch Bitcoin price:', error);

      this.broadcastError(error.message || 'Failed to fetch Bitcoin price');
    }
  }

  handleRateLimit(response) {
    this.stats.rateLimitHits++;
    this.isRateLimited = true;

    // Try to get retry-after header
    const retryAfter = response.headers.get('retry-after');
    const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : this.config.rateLimitDelay;

    this.rateLimitResetTime = Date.now() + retryDelay;

    console.warn(`Rate limited. Will retry after ${Math.ceil(retryDelay / 1000)} seconds.`);

    this.broadcastError(
      `Rate limited by CoinGecko API. Retrying in ${Math.ceil(retryDelay / 1000)} seconds.`,
    );

    // Schedule retry
    setTimeout(() => {
      this.fetchPrice();
    }, retryDelay);
  }

  isCacheValid() {
    if (!this.currentPrice || !this.lastFetch) return false;
    return Date.now() - this.lastFetch < this.config.cacheTTL;
  }

  startPeriodicUpdates() {
    if (this.fetchInterval) return;

    this.fetchInterval = setInterval(() => {
      if (this.clients.size > 0) {
        this.fetchPrice();
      }
    }, this.config.pollInterval);

    console.log(`Started periodic updates every ${this.config.pollInterval / 1000} seconds`);
  }

  stopPeriodicUpdates() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
      console.log('Stopped periodic updates');
    }
  }

  broadcast(message) {
    this.clients.forEach((client) => {
      this.sendToClient(client, message);
    });
  }

  broadcastError(error) {
    this.broadcast({
      type: 'error',
      payload: { error },
    });
  }

  sendToClient(client, message) {
    try {
      client.postMessage(message);
    } catch (error) {
      console.warn('Failed to send message to client:', error);
      // Remove invalid client
      this.clients.delete(client);
      this.stats.clientCount = this.clients.size;
    }
  }

  // Update configuration from environment variables
  updateConfig(config) {
    this.config = { ...this.config, ...config };

    // Restart periodic updates with new interval
    if (this.fetchInterval) {
      this.stopPeriodicUpdates();
      this.startPeriodicUpdates();
    }

    console.log('Configuration updated:', this.config);
  }
}

// Initialize worker
const priceWorker = new BitcoinPriceWorker();

// Handle new connections
self.onconnect = function (event) {
  const port = event.ports[0];
  priceWorker.addClient(port);
  port.start();
};

// Handle global messages (for configuration updates)
self.onmessage = function (event) {
  const { type, payload } = event.data;

  if (type === 'update-config') {
    priceWorker.updateConfig(payload);
  }
};

console.log('Bitcoin Price SharedWorker script loaded');
