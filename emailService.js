// emailService.js

/**
 * A resilient email sending service using two mock providers with
 * retry, fallback, idempotency, rate limiting, and status tracking.
 *
 * Author: Ashish Tripathi
 */

class MockProviderA {
  constructor() {
    this.name = 'ProviderA';
  }

  async sendEmail(email) {
    if (Math.random() < 0.7) throw new Error('ProviderA failed');
    console.log(`[ProviderA] Sent to ${email.to}`);

  }
}

class MockProviderB {
  constructor() {
    this.name = 'ProviderB';
  }

  async sendEmail(email) {
    if (Math.random() < 0.5) throw new Error('ProviderB failed');
    console.log(`[ProviderA] Sent to ${email.to}`);

  }
}

class RateLimiter {
  constructor(limit, intervalMs) {
    this.limit = limit;
    this.intervalMs = intervalMs;
    this.requests = [];
  }

  allow() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.intervalMs);
    if (this.requests.length >= this.limit) return false;
    this.requests.push(now);
    return true;
  }
}

class CircuitBreaker {
  constructor(threshold, timeout) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }

  canTry() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.reset();
        return true;
      }
      return false;
    }
    return true;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) this.state = 'OPEN';
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}

class EmailService {
  constructor(providers) {
    this.providers = providers;
    this.sentEmails = new Set();
    this.rateLimiter = new RateLimiter(5, 10000); // 5 per 10 sec
    this.circuitBreakers = {};
    for (const provider of providers) {
      this.circuitBreakers[provider.name] = new CircuitBreaker(3, 10000);
    }
  }

  async trySend(provider, email, retries = 3, delay = 500) {
    const breaker = this.circuitBreakers[provider.name];
    if (!breaker.canTry()) return false;

    for (let i = 0; i < retries; i++) {
      try {
        await provider.sendEmail(email);
        breaker.reset();
        return true;
      } catch (err) {
        breaker.recordFailure();
        await new Promise(res => setTimeout(res, delay * 2 ** i));
      }
    }
    return false;
  }

  async sendEmail(email) {
    if (this.sentEmails.has(email.id)) {
      return `Already sent email ${email.id}`;

    }

    if (!this.rateLimiter.allow()) {
      return `Rate limit exceeded for email ${email.id}`;

    }

    for (const provider of this.providers) {
      const success = await this.trySend(provider, email);
      if (success) {
        this.sentEmails.add(email.id);
        return `Email ${email.id} sent successfully via ${provider.name}`;

      }
    }

    return `Failed to send email ${email.id} with all providers.`;

  }
}



// ------------------------ Test Runner ------------------------
(async () => {
  const service = new EmailService([new MockProviderA(), new MockProviderB()]);

  for (let i = 1; i <= 10; i++) {
  const email = {
    id: `email-${i}`,
    to: `user${i}@example.com`,
    subject: 'Test Email',
    body: 'Hello, this is a test.',
  };

    const result = await service.sendEmail(email);
    console.log(result);
  }
})();
