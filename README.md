# 📧 Resilient Email Sending Service

A robust, fail-safe email delivery system built in JavaScript (Node.js), simulating real-world reliability patterns like **retries**, **fallback**, **circuit breakers**, **rate limiting**, and **idempotency** using two mock email providers.

---

## 🧠 Why This Project?

Email delivery can fail for many reasons — provider downtime, rate limits, or transient errors.  
This project ensures that emails are delivered **reliably**, **efficiently**, and **only once**, even in the face of failures.

---

## 🚀 Features

| Feature             | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| ✅ Multiple Providers | Uses two mock providers (ProviderA & ProviderB) for redundancy             |
| 🔁 Retry Logic       | Retries sending emails with exponential backoff (up to 3 times)            |
| 🔄 Fallback          | Automatically switches to a backup provider if the primary fails          |
| 🧠 Circuit Breaker   | Temporarily disables failing providers to prevent cascading failures       |
| ⏳ Rate Limiting     | Allows max 5 emails per 10 seconds to simulate sending limits              |
| 🆔 Idempotency       | Ensures the same email (by ID) is never sent more than once                |
| 📊 Status Tracking   | Logs and tracks whether each email was sent or failed                      |

---

## 🛠️ Project Structure

```bash
emailService.js       # Contains all logic and runs the test


## 🧩 Functional Overview

---

### 🔹 **`MockProviderA` & `MockProviderB`**
- Simulates success/failure using `Math.random()`
- **ProviderA:** ~70% failure rate  
- **ProviderB:** ~50% failure rate  
- **Function:** `sendEmail(email)`

---

### 🔹 **`RateLimiter(limit, intervalMs)`**
- Ensures only `limit` emails are sent every `intervalMs` milliseconds
- Prevents abuse or throttling from providers  
- **Function:** `allow()` → returns `true` or `false` based on recent send timestamps

---

### 🔹 **`CircuitBreaker(threshold, timeout)`**
- Opens the circuit after `threshold` consecutive failures
- Prevents retrying failing providers for `timeout` milliseconds

**Functions:**
- `canTry()` → returns `false` if circuit is open  
- `recordFailure()` → logs failure, opens circuit if threshold exceeded  
- `reset()` → closes the circuit on success or after timeout

---

### 🔹 **`EmailService`**
- **Central brain** of the system: manages sending, retrying, fallback, rate limiting, and tracking

**Key Functions:**

#### 🔸 `trySend(provider, email, retries = 3, delay = 500)`
- Tries sending email via a provider
- Retries up to 3 times with **exponential backoff**

#### 🔸 `sendEmail(email)`
- Handles:
  - ✅ **Idempotency check** – avoids duplicate sends
  - ✅ **Rate limiting** – skips if too many sent recently
  - ✅ **Circuit breaker check** – skips dead providers
  - ✅ **Fallback across providers** – tries alternate if one fails

---



🧪 Sample Output

      [ProviderA] Sent to user1@example.com
      Email email-1 sent successfully via ProviderA

      Rate limit exceeded for email email-6
      Email email-6 not sent

     Failed to send email email-9 with all providers.


📘 Sample Email Object

      const email = {
        id: 'email-1',
        to: 'user1@example.com',
        subject: 'Test Email',
        body: 'Hello, this is a test.',
     };
