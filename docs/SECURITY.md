# Security Architecture — VELoop Rewards & AI Studio

## 1. Daily Streak Backend Authority
- **Zero Client Trust**: React never controls streak count, current day, claim eligibility, reward values, wallet balances, or countdown unlock authority.
- **JWT Ownership Enforcement**: `requireAuth` (`src/backend/middleware/auth.middleware.ts`) extracts `userId` strictly from the verified JWT token (`Authorization: Bearer <token>`). Any `userId` mismatch in `req.body` or `req.query` is rejected with `403 CROSS_USER_FORBIDDEN`.
- **Atomic Concurrency Lock**: `withUserLock(userId, task)` serializes concurrent requests for the same user so simultaneous `POST /api/daily-streak/claim` calls cannot double-credit rewards.
- **Server-Side Time**: All timer locks (`nextClaimAt`) and missed-streak resets (`expireAt`) are evaluated against backend server timestamps.

## 2. Gemini AI Studio Route Hardening (`src/backend/routes/ai.routes.ts`)
- **Authentication & Rate Limiting**: Protected by `requireAuth` + `aiRateLimiter` (30 requests/min).
- **Image Payload Validation**: Enforces `MAX_DECODED_BYTES = 5 MB` and restricts MIME types to `image/jpeg`, `image/png`, and `image/webp`.
- **Prompt Sanitization**: Strips control characters and enforces `MAX_PROMPT_LENGTH`.
- **Safe JSON Parsing**: Wraps `JSON.parse` in `safeParseJson` and sanitizes error responses so internal stack traces are never leaked to clients.
