# API & Testing Documentation — VELoop Rewards Daily Streak System

**Intern Name:** Vindhyashree S  
**Intern ID:** VLRINT202601730  

## 1. Daily Streak REST API

All Daily Streak endpoints (except `/api/auth/login`) require `Authorization: Bearer <JWT_TOKEN>`.

### `GET /api/daily-streak/leaderboard?limit=10`
Returns aggregated rank data for the Top 10 users with the longest streaks, summary KPIs, and the current user's global rank standing.

### `GET /api/daily-streak`
Returns the authoritative streak state, 7 reward cards, statistics, ultimate reward, and wallet balance.

```json
{
  "success": true,
  "serverTime": "2026-09-27T05:00:00.000Z",
  "streak": {
    "cycleId": "CYCLE_USR01_001",
    "currentStreak": 1,
    "currentDay": 2,
    "checkedIn": 1,
    "totalRewards": 7,
    "status": "ACTIVE",
    "canClaimToday": true,
    "nextClaimAt": null
  },
  "statistics": {
    "totalRewards": 7,
    "checkedIn": 1,
    "nextReward": {
      "day": 2,
      "amount": 10,
      "currency": "VES",
      "label": "+10 VEs"
    }
  }
}
```

### `POST /api/daily-streak/claim`
Validates user identity from JWT, sequential day progression, previous-day completion, and 24-hour server timer. Ignores any client-supplied `reward`, `amount`, `currency`, or `streak` fields.

---

## 2. Anti-Cheat & Edge Case Verification (`TESTING.md`)

You can run all tests directly in the UI using the **Anti-Cheat Test Lab** button in the top bar:
1. **Normal Claim**: Click `Claim Reward` on today's eligible card -> CPA Demo verification modal runs -> backend credits wallet and starts 24h timer.
2. **Duplicate Claim (`409 ALREADY_CLAIMED`)**: Sending `POST /api/daily-streak/claim` for an already claimed day is rejected without crediting twice.
3. **Concurrent Request Protection (`Promise.all`)**: Sending two simultaneous claim requests at the same millisecond uses `withUserLock(userId)` so only one request grants `+10 VEs` and the second receives `409 Conflict`.
4. **Day Jump Cheat (`400 SEQUENTIAL_VIOLATION`)**: Sending `{ "day": 7 }` while eligible for Day 2 is rejected.
5. **Reward Manipulation Cheat**: Sending `{ "day": 2, "reward": 1000000 }` ignores the fake reward and credits the configured `+10 VEs`.
6. **Cross-User Ownership Cheat (`403 CROSS_USER_FORBIDDEN`)**: Sending `{ "userId": "anotherUser" }` is blocked by `requireAuth` middleware.
7. **24-Hour Timer Lock (`400 STILL_LOCKED`)**: Attempting to claim the next day before `serverTime >= nextClaimAt` is rejected regardless of client PC/phone clock changes.
8. **Missed-Day Streak Reset**: Click `+49h Simulate Missed Day` in the top bar -> backend detects `serverTime > expireAt`, marks the cycle `RESET`, logs `STREAK_RESET`, and resets the user to `Day 1` (`Current Streak: 0`).
