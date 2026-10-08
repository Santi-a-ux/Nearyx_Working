import Redis from 'ioredis';

/**
 * Redis pub/sub with one publisher and one shared subscriber connection
 * (the Python service opened a Redis connection per WebSocket).
 */
export class RedisBroker {
  constructor(url) {
    this.publisher = new Redis(url);
    this.subscriber = new Redis(url);
    this.handlers = new Map(); // channel -> Set<(message: string) => void>

    for (const client of [this.publisher, this.subscriber]) {
      client.on('error', (err) => console.error('[redis]', err.message));
    }
    this.subscriber.on('message', (channel, message) => {
      for (const handler of this.handlers.get(channel) ?? []) handler(message);
    });
  }

  async publish(channel, message) {
    await this.publisher.publish(channel, message);
  }

  /** Resolves to an async `unsubscribe()` once Redis has acknowledged the subscription. */
  async subscribe(channel, handler) {
    let set = this.handlers.get(channel);
    const isFirst = !set;
    if (isFirst) {
      set = new Set();
      this.handlers.set(channel, set);
    }
    set.add(handler);
    if (isFirst) await this.subscriber.subscribe(channel);

    return async () => {
      set.delete(handler);
      if (set.size === 0 && this.handlers.get(channel) === set) {
        this.handlers.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
    };
  }

  async close() {
    await Promise.allSettled([this.publisher.quit(), this.subscriber.quit()]);
  }
}
