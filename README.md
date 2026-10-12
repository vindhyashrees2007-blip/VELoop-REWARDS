# VELoop Rewards — Daily Streak System & AI Meme Studio

**Intern Name:** Vindhyashree S  
**Intern ID:** VLRINT202601730  

Full-Stack **MERN + Bootstrap + CSS Modules + Gemini AI** implementation of the **VELoop Rewards Daily Streak System** (Sections 1–127), the **Top 10 StreakLeaderboard**, and the **AI Meme & Social Content Studio**.

---

## 1. Project Overview & Core Principle

**The frontend is never the source of truth.** Every business value and decision is calculated, validated, and persisted by the Node.js / Express / MongoDB backend:
- **Current streak & current day** (`StreakCycle`)
- **7-day reward configuration** (`StreakReward`: Day 1 `+5 VEs`, Day 2 `+10 VEs`, Day 3 `+15 VEs`, Day 4 `₹1 Amazon Gift Card`, Day 5 `₹2 Amazon Gift Card`, Day 6 `+30 VEs`, Day 7 `₹5 Amazon Gift Card Ultimate Reward`)
- **24-hour server-side countdown timer** (`nextClaimAt` & `serverTime` returned by backend; frontend uses monotonic elapsed time relative to `serverTime` so changing the device clock cannot unlock a claim early)
- **Sequential & previous-day validation** (prevents jumping from Day 1 to Day 7)
- **Missed-day detection & automatic streak reset** (`expireAt` 48-hour window check)
- **Atomic idempotency & concurrent request protection** (per-user mutex lock + unique compound constraint `userId + cycleId + day`)
- **Backend Wallet & Transaction Ledger** (`Wallet` & `WalletTransaction` with `balanceBefore`, `balanceAfter`, and `referenceId`)

---

## 2. Database Models (`src/backend/models/schemas.ts`)

1. `User`: `userId`, `email`, `name`, `passwordHash`, `eligible`, `serverTimeOffsetMs`
2. `Wallet`: `userId`, `veBalance`, `giftCardBalanceInr`, `updatedAt`
3. `StreakConfig`: `configId`, `totalDays` (7), `claimIntervalMs` (24h), `missedWindowMs` (48h), `resetOnMiss`
4. `StreakReward`: `rewardId`, `day` (1–7), `rewardType`, `currency`, `amount`, `displayValue`, `title`, `subtitle`, `badge`, `assetType`, `isUltimate`
5. `StreakCycle`: `cycleId`, `userId`, `cycleNumber`, `currentStreak`, `currentDay`, `status`, `lastClaimedDay`, `lastClaimedAt`, `nextClaimAt`, `expireAt`
6. `StreakClaim`: `claimId`, `userId`, `cycleId`, `day`, `rewardId`, `amount`, `currency`, `status`, `claimedAt`, `transactionId`, `referenceId` (Unique index: `userId + cycleId + day`)
7. `WalletTransaction`: `transactionId`, `userId`, `currency`, `rewardType`, `type`, `amount`, `source`, `streakDay`, `referenceId`, `balanceBefore`, `balanceAfter`, `createdAt`
8. `AuditLog`: `logId`, `userId`, `eventType`, `day`, `cycleId`, `reason`, `payloadSnapshot`, `serverTimestamp`

---

## 3. API Endpoints (`docs/API_DOCUMENTATION.md`)

### Daily Streak & Wallet APIs
- `POST /api/auth/login` — Authenticates user and returns a signed JWT Bearer token.
- `GET /api/daily-streak` — Returns complete backend-calculated streak state, statistics, ultimate reward, wallet balance, and 7 daily card states.
- `GET /api/daily-streak/status` — Lightweight status endpoint called when the 24-hour visual countdown reaches `00:00:00`.
- `POST /api/daily-streak/claim` — Validates JWT ownership, sequential day, previous-day claim, 24-hour timer lock, and idempotency before granting reward and recording wallet transaction.
- `GET /api/daily-streak/history` — Returns claim history, wallet ledger transactions, and security audit logs.
- `GET /api/daily-streak/leaderboard` — Aggregates `Users`, `StreakCycles`, and `Wallets` to return the Top 10 users with the longest streaks, podium rankings, and the authenticated user's global rank standing.
- `GET /api/wallet` — Returns current wallet balances and transaction history.
- `POST /api/daily-streak/simulate` — Evaluator tool to advance server time (`+24h` or `+49h`) or reset state.

### Gemini AI Studio APIs (`src/backend/routes/ai.routes.ts`)
- `POST /api/ai/magic-captions` — Analyzes an image with `gemini-3.1-pro-preview` and returns 5 funny, context-aware captions.
- `POST /api/ai/analyze-image` — Deep visual analysis with `gemini-3.1-pro-preview`.
- `POST /api/ai/generate-image` — Creates or edits images from text prompts with `gemini-3.1-flash-image-preview`.
- `POST /api/ai/meme-score`, `/api/ai/alt-text`, `/api/ai/enhance-prompt`, `/api/ai/rewrite`, `/api/ai/social-post`, `/api/ai/hashtags`, `/api/ai/meme-title`, `/api/ai/image-to-post`.
