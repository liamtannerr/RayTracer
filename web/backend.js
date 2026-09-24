export class Backend {
  // Keep native fetch's global receiver; calling it as this.fetcher breaks in browsers.
  constructor(baseUrl, onChange, { fetcher = (...args) => fetch(...args), timeoutMs = 10000, retryMs = 3000, attempts = 40, maxWaitMs = 120000, now = Date.now } = {}) {
    Object.assign(this, { baseUrl, onChange, fetcher, timeoutMs, retryMs, attempts, maxWaitMs, now });
    this.state = 'idle';
    this.checkedAt = -Infinity;
    this.pending = null;
  }
  get ready() { return this.state === 'ready' && this.now() - this.checkedAt < 60000; }
  setState(state) { this.state = state; this.onChange(state); }
  wake() {
    if (this.pending) return this.pending;
    this.setState('warming');
    this.pending = this.check().finally(() => { this.pending = null; });
    return this.pending;
  }
  async check() {
    const deadline = this.now() + this.maxWaitMs;
    for (let attempt = 0; attempt < this.attempts && this.now() < deadline; attempt++) {
      try {
        const response = await this.fetcher(`${this.baseUrl}/api/health`, {
          cache: 'no-store', signal: AbortSignal.timeout(Math.max(1, Math.min(this.timeoutMs, deadline - this.now()))), credentials: 'omit'
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json') && (await response.json()).status === 'ok') {
          this.checkedAt = this.now();
          this.setState('ready');
          return true;
        }
      } catch { /* Cold starts, CORS, and connection failures can be retried. */ }
      if (attempt + 1 < this.attempts) await new Promise(resolve => setTimeout(resolve, Math.max(0, Math.min(this.retryMs, deadline - this.now()))));
    }
    this.setState('unavailable');
    return false;
  }
}
