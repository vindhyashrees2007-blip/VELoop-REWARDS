# Database Schema & Integrity — VELoop Rewards

All models are defined in `src/backend/models/schemas.ts` using Mongoose and persisted via `src/backend/config/db.ts`.

## Traceable Relationship (Section 104)

Every successful claim creates a linked chain of records that can be inspected live via the **MongoDB Inspector** button in the top bar (`GET /api/debug/database`):

```text
StreakCycle (cycleId)
   ↓
StreakClaim (claimId, userId, cycleId, day, rewardId, transactionId, referenceId)
   ↓
StreakReward (rewardId, day, rewardType, amount, currency)
   ↓
WalletTransaction (transactionId, userId, streakDay, referenceId, balanceBefore, balanceAfter)
   ↓
Wallet (userId, veBalance, giftCardBalanceInr)
   ↓
AuditLog (logId, userId, eventType: STREAK_CLAIM_SUCCESS, serverTimestamp)
```

### Unique Constraints
- `StreakClaim`: Compound unique index on `{ userId: 1, cycleId: 1, day: 1 }` prevents duplicate claims for the same cycle and day.
- `WalletTransaction`: Unique index on `transactionId` and `referenceId`.
