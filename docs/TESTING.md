# Testing Documentation — VELoop Rewards Daily Streak System

This document details how each functional and security requirement from Sections 96–111 is tested and verified.

## 1. Automated In-App Security Suite ("Anti-Cheat Test Lab")

Click the **Anti-Cheat Test Lab** button in the top bar of the application and click **Run All 6 Anti-Cheat Tests Now** to execute live HTTP requests against `POST /api/daily-streak/claim`:

1. **Normal Claim**:
   - **Action**: Click `Claim Reward` on today's eligible card (e.g. Day 2 for `demo@velooprewards.in` or Day 1 for `fresh@velooprewards.in`).
   - **Expected**: Backend validates JWT, sequential day, previous-day completion, and 24-hour timer -> shows CPA Advertisement Demo -> credits wallet (`+10 VEs` or `+5 VEs`), creates `WalletTransaction` and `StreakClaim`, and locks the next day with a 24-hour `nextClaimAt` timestamp.
2. **Duplicate Claim (`409 Conflict — ALREADY_CLAIMED`)**:
   - **Action**: Send a second `POST /api/daily-streak/claim` for an already claimed day.
   - **Expected**: Rejected with `409 Conflict`, logs `DUPLICATE_CLAIM` in `AuditLog`, wallet balance is unchanged.
3. **Concurrent Request Protection (`Promise.all`)**:
   - **Action**: Send two simultaneous `POST /api/daily-streak/claim` requests at the exact same millisecond.
   - **Expected**: `withUserLock(userId)` serializes execution; Request A succeeds (`+10 VEs`), Request B receives `409ALREADY_CLAIMED`. Total credited is `+10 VEs`, never `+20 VEs`.
4. **Locked 24-Hour Reward (`400 Bad Request — STILL_LOCKED`)**:
   - **Action**: Attempt to claim the next day before `serverTime >= nextClaimAt`.
   - **Expected**: Rejected with `400 STILL_LOCKED` ("Your next reward is not available yet.").
5. **Changed Device Time (Section 97)**:
   - **Action**: Change the client computer/phone clock forward by 24 hours.
   - **Expected**: Visual timer uses monotonic delta from `serverTime` (`performance.now()`) and backend validates against authoritative server time, so changing the system clock cannot unlock the claim early.
6. **Fake Day / Sequential Jump (`400 Bad Request — SEQUENTIAL_VIOLATION`)**:
   - **Action**: Send `{ "day": 7 }` while only eligible for Day 2.
   - **Expected**: Rejected with `400 Bad Request` and logged in `AuditLog`.
7. **Fake Reward Manipulation (Section 98)**:
   - **Action**: Send `{ "day": 2, "reward": 1000000, "currency": "VES", "streak": 7 }`.
   - **Expected**: Backend ignores all client-supplied reward/streak fields, logs `INVALID_CLAIM`, and credits only the configured `+10 VEs`.
8. **Fake User / Cross-User Attack (`403 Forbidden — CROSS_USER_FORBIDDEN`)**:
   - **Action**: Send `{ "userId": "anotherUser" }` in request body/query while authenticated as another user.
   - **Expected**: `requireAuth` middleware detects ownership mismatch, logs `INVALID_CLAIM`, and rejects with `403 Forbidden`.
9. **Missed Day & Streak Reset (Sections 15, 49, 50, 103)**:
   - **Action**: Click **+49h Simulate Missed Day** in the top bar after claiming Day 1 or Day 2.
   - **Expected**: Server clock advances past `expireAt` (48 hours after last claim), backend marks the cycle `RESET`, logs `STREAK_RESET`, creates a new `StreakCycle` at `Day 1` (`Current Streak: 0`), and updates the UI automatically.
