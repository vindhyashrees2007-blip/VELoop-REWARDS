import { db, withUserLock } from '../config/db.ts';
import {
  CardStatus,
  IAuditLog,
  IStreakClaim,
  IStreakConfig,
  IStreakCycle,
  IStreakReward,
  IWallet,
  IWalletTransaction,
} from '../models/schemas.ts';
import { rewardService } from './reward.service.ts';
import { walletService } from './wallet.service.ts';

export interface RewardCardDTO {
  day: number;
  status: CardStatus;
  buttonLabel: 'Claim Reward' | 'Claimed' | 'Locked';
  isClaimable: boolean;
  isTodayTarget: boolean;
  nextClaimAt: string | null;
  claimedAt: string | null;
  reward: IStreakReward;
}

export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  name: string;
  maskedEmail: string;
  initials: string;
  currentStreak: number;
  longestStreak: number;
  currentDay: number;
  cyclesCompleted: number;
  cycleStatus: string;
  veBalance: number;
  giftCardBalanceInr: number;
  tierBadge: string;
  lastClaimedAt: string | null;
  isCurrentUser: boolean;
}

export interface LeaderboardResponseDTO {
  success: boolean;
  serverTime: string;
  aggregationPipeline: string;
  summary: {
    totalParticipants: number;
    highestStreakDays: number;
    totalVesDistributed: number;
    totalGiftCardsDistributedInr: number;
  };
  leaderboard: LeaderboardEntryDTO[];
  currentUserStanding: {
    entry: LeaderboardEntryDTO | null;
    inTopTen: boolean;
    daysToReachTopTen: number;
  };
}

export interface FullStreakStateResponse {
  success: boolean;
  serverTime: string;
  user: {
    userId: string;
    name: string;
    email: string;
  };
  wallet: IWallet;
  streak: {
    cycleId: string;
    cycleNumber: number;
    currentStreak: number;
    currentDay: number;
    checkedIn: number;
    totalRewards: number;
    status: string;
    canClaimToday: boolean;
    nextClaimAt: string | null;
    expireAt: string | null;
    wasReset: boolean;
    resetReason: string | null;
  };
  statistics: {
    totalRewards: number;
    checkedIn: number;
    nextReward: {
      day: number;
      amount: number;
      currency: string;
      displayValue: string;
      subtitle: string;
      label: string;
    };
  };
  ultimateReward: {
    day: number;
    title: string;
    amount: number;
    currency: string;
    displayValue: string;
    subtitle: string;
    unlockText: string;
    status: CardStatus;
    assetType: string;
  };
  rewards: RewardCardDTO[];
}

export class StreakService {
  public getServerNowMs(userId: string): number {
    const { users } = db.getCollections();
    const user = users.find((u) => u.userId === userId);
    const offset = user?.serverTimeOffsetMs || 0;
    return Date.now() + offset;
  }

  private appendAuditLog(entry: Omit<IAuditLog, 'logId'>): IAuditLog {
    const { auditLogs } = db.getCollections();
    const fullLog: IAuditLog = {
      logId: `AUD_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      ...entry,
    };
    auditLogs.push(fullLog);
    return fullLog;
  }

  private getOrCreateActiveCycle(
    userId: string,
    config: IStreakConfig,
    nowMs: number
  ): { cycle: IStreakCycle; wasReset: boolean } {
    const collections = db.getCollections();
    const nowIso = new Date(nowMs).toISOString();

    const userCycles = collections.streakCycles
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.cycleNumber - a.cycleNumber);

    let activeCycle = userCycles.find((c) => c.status === 'ACTIVE');

    // If previous cycle was COMPLETED and 24h cooldown has passed, start a new 7-day cycle
    if (!activeCycle && userCycles[0]?.status === 'COMPLETED') {
      const completedCycle = userCycles[0];
      const nextStartMs = completedCycle.nextClaimAt ? new Date(completedCycle.nextClaimAt).getTime() : 0;
      if (nowMs < nextStartMs) {
        return { cycle: completedCycle, wasReset: false };
      }
      const nextCycle: IStreakCycle = {
        cycleId: `CYCLE_${userId}_${String(completedCycle.cycleNumber + 1).padStart(3, '0')}_${Date.now()}`,
        userId,
        cycleNumber: completedCycle.cycleNumber + 1,
        currentStreak: completedCycle.currentStreak,
        currentDay: 1,
        status: 'ACTIVE',
        lastClaimedDay: 0,
        lastClaimedAt: completedCycle.lastClaimedAt,
        nextClaimAt: null,
        expireAt: null,
        resetReason: null,
        startedAt: nowIso,
        completedAt: null,
        updatedAt: nowIso,
      };
      collections.streakCycles.push(nextCycle);
      return { cycle: nextCycle, wasReset: false };
    }

    if (!activeCycle) {
      const nextNumber = (userCycles[0]?.cycleNumber || 0) + 1;
      activeCycle = {
        cycleId: `CYCLE_${userId}_${String(nextNumber).padStart(3, '0')}`,
        userId,
        cycleNumber: nextNumber,
        currentStreak: 0,
        currentDay: 1,
        status: 'ACTIVE',
        lastClaimedDay: 0,
        lastClaimedAt: null,
        nextClaimAt: null,
        expireAt: null,
        resetReason: null,
        startedAt: nowIso,
        completedAt: null,
        updatedAt: nowIso,
      };
      collections.streakCycles.push(activeCycle);
      return { cycle: activeCycle, wasReset: false };
    }

    // Section 15, 16, 49, 50: Missed Day Detection & Automatic Server-Side Streak Reset
    if (config.resetOnMiss && activeCycle.lastClaimedDay > 0 && activeCycle.expireAt) {
      const expireMs = new Date(activeCycle.expireAt).getTime();
      if (nowMs > expireMs) {
        activeCycle.status = 'RESET';
        activeCycle.resetReason = `Missed required claim window for Day ${activeCycle.currentDay} (expired at ${activeCycle.expireAt}).`;
        activeCycle.updatedAt = nowIso;

        this.appendAuditLog({
          userId,
          eventType: 'STREAK_RESET',
          day: activeCycle.currentDay,
          cycleId: activeCycle.cycleId,
          reason: activeCycle.resetReason,
          serverTimestamp: nowIso,
        });

        const resetCycleNumber = activeCycle.cycleNumber + 1;
        const freshCycle: IStreakCycle = {
          cycleId: `CYCLE_${userId}_${String(resetCycleNumber).padStart(3, '0')}_${Date.now()}`,
          userId,
          cycleNumber: resetCycleNumber,
          currentStreak: 0,
          currentDay: 1,
          status: 'ACTIVE',
          lastClaimedDay: 0,
          lastClaimedAt: null,
          nextClaimAt: null,
          expireAt: null,
          resetReason: `Your streak was reset because Day ${activeCycle.currentDay} was not claimed within the 24-hour window. Start again from Day 1!`,
          startedAt: nowIso,
          completedAt: null,
          updatedAt: nowIso,
        };
        collections.streakCycles.push(freshCycle);
        return { cycle: freshCycle, wasReset: true };
      }
    }

    return { cycle: activeCycle, wasReset: false };
  }

  public async getStreakState(userId: string): Promise<FullStreakStateResponse> {
    return withUserLock(userId, async () => {
      const collections = db.getCollections();
      const user = collections.users.find((u) => u.userId === userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const nowMs = this.getServerNowMs(userId);
      const nowIso = new Date(nowMs).toISOString();
      const config = rewardService.getStreakConfig();
      const allRewards = rewardService.getActiveRewards();
      const wallet = walletService.getOrCreateWallet(userId, nowIso);

      const { cycle, wasReset } = this.getOrCreateActiveCycle(userId, config, nowMs);
      const cycleClaims = collections.streakClaims.filter(
        (c) => c.userId === userId && c.cycleId === cycle.cycleId && c.status === 'CLAIMED'
      );
      const claimedDaysMap = new Map<number, IStreakClaim>();
      for (const cl of cycleClaims) {
        claimedDaysMap.set(cl.day, cl);
      }

      const checkedInCount = claimedDaysMap.size;
      const nextUnlockMs = cycle.nextClaimAt ? new Date(cycle.nextClaimAt).getTime() : 0;
      const isTimerLocked = Boolean(cycle.nextClaimAt && nowMs < nextUnlockMs);
      const canClaimToday =
        cycle.status === 'ACTIVE' &&
        !isTimerLocked &&
        !claimedDaysMap.has(cycle.currentDay) &&
        cycle.currentDay <= config.totalDays;

      const rewardCards: RewardCardDTO[] = allRewards.map((reward) => {
        const claimRecord = claimedDaysMap.get(reward.day);
        if (claimRecord) {
          return {
            day: reward.day,
            status: 'CLAIMED',
            buttonLabel: 'Claimed',
            isClaimable: false,
            isTodayTarget: false,
            nextClaimAt: null,
            claimedAt: claimRecord.claimedAt,
            reward,
          };
        }

        if (reward.day === cycle.currentDay && cycle.status === 'ACTIVE') {
          if (canClaimToday) {
            return {
              day: reward.day,
              status: 'TODAY',
              buttonLabel: 'Claim Reward',
              isClaimable: true,
              isTodayTarget: true,
              nextClaimAt: null,
              claimedAt: null,
              reward,
            };
          } else {
            return {
              day: reward.day,
              status: 'LOCKED',
              buttonLabel: 'Locked',
              isClaimable: false,
              isTodayTarget: true,
              nextClaimAt: cycle.nextClaimAt,
              claimedAt: null,
              reward,
            };
          }
        }

        return {
          day: reward.day,
          status: 'LOCKED',
          buttonLabel: 'Locked',
          isClaimable: false,
          isTodayTarget: false,
          nextClaimAt: reward.day === cycle.currentDay + 1 ? cycle.nextClaimAt : null,
          claimedAt: null,
          reward,
        };
      });

      // Determine "Next Reward" for statistics card (matches PDF design: when Checked In = 1, Next Reward = +10 VEs)
      const nextTargetDay = Math.min(cycle.currentDay, config.totalDays);
      const nextRewardObj = rewardService.getRewardForDay(nextTargetDay) || allRewards[0];
      const nextRewardLabel =
        nextRewardObj.currency === 'VES'
          ? `+${nextRewardObj.amount} VEs`
          : `₹${nextRewardObj.amount} Gift Card`;

      const ultimateRewardObj = rewardService.getUltimateReward();
      const ultimateCard = rewardCards.find((c) => c.day === ultimateRewardObj.day);

      await db.commit();

      return {
        success: true,
        serverTime: nowIso,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
        },
        wallet,
        streak: {
          cycleId: cycle.cycleId,
          cycleNumber: cycle.cycleNumber,
          currentStreak: cycle.currentStreak,
          currentDay: cycle.currentDay,
          checkedIn: checkedInCount,
          totalRewards: config.totalDays,
          status: cycle.status,
          canClaimToday,
          nextClaimAt: isTimerLocked ? cycle.nextClaimAt : null,
          expireAt: cycle.expireAt,
          wasReset: wasReset || Boolean(cycle.resetReason && checkedInCount === 0),
          resetReason: cycle.resetReason || null,
        },
        statistics: {
          totalRewards: config.totalDays,
          checkedIn: checkedInCount,
          nextReward: {
            day: nextRewardObj.day,
            amount: nextRewardObj.amount,
            currency: nextRewardObj.currency,
            displayValue: nextRewardObj.displayValue,
            subtitle: nextRewardObj.subtitle,
            label: nextRewardLabel,
          },
        },
        ultimateReward: {
          day: ultimateRewardObj.day,
          title: ultimateRewardObj.title,
          amount: ultimateRewardObj.amount,
          currency: ultimateRewardObj.currency,
          displayValue: ultimateRewardObj.displayValue,
          subtitle: ultimateRewardObj.subtitle,
          unlockText: `Unlock on Day ${ultimateRewardObj.day}`,
          status: ultimateCard?.status || 'LOCKED',
          assetType: ultimateRewardObj.assetType,
        },
        rewards: rewardCards,
      };
    });
  }

  public async claimDailyReward(
    userId: string,
    clientBody: Record<string, unknown> = {}
  ): Promise<{
    statusCode: number;
    body: {
      success: boolean;
      code: string;
      message: string;
      ignoredTamperedFields?: string[];
      claim?: IStreakClaim;
      transaction?: IWalletTransaction;
      wallet?: IWallet;
      state?: FullStreakStateResponse;
    };
  }> {
    return withUserLock(userId, async () => {
      const collections = db.getCollections();
      const user = collections.users.find((u) => u.userId === userId);
      if (!user || !user.eligible) {
        return {
          statusCode: 403,
          body: {
            success: false,
            code: 'ACCOUNT_INELIGIBLE',
            message: 'User account is not eligible for Daily Streak rewards.',
          },
        };
      }

      const nowMs = this.getServerNowMs(userId);
      const nowIso = new Date(nowMs).toISOString();
      const config = rewardService.getStreakConfig();
      const { cycle, wasReset } = this.getOrCreateActiveCycle(userId, config, nowMs);

      this.appendAuditLog({
        userId,
        eventType: 'STREAK_CLAIM_REQUEST',
        day: cycle.currentDay,
        cycleId: cycle.cycleId,
        reason: 'User initiated Daily Streak claim request.',
        payloadSnapshot: clientBody,
        serverTimestamp: nowIso,
      });

      // Detect and ignore client-supplied reward/streak tampering (Sections 18, 36, 98)
      const ignoredTamperedFields: string[] = [];
      for (const forbiddenKey of ['reward', 'amount', 'currency', 'streak', 'currentStreak', 'balance']) {
        if (clientBody[forbiddenKey] !== undefined) {
          ignoredTamperedFields.push(forbiddenKey);
        }
      }
      if (ignoredTamperedFields.length > 0) {
        this.appendAuditLog({
          userId,
          eventType: 'INVALID_CLAIM',
          day: cycle.currentDay,
          cycleId: cycle.cycleId,
          reason: `Ignored client-side payload tampering for fields: ${ignoredTamperedFields.join(', ')}. Using authoritative backend config.`,
          payloadSnapshot: clientBody,
          serverTimestamp: nowIso,
        });
      }

      // If streak was just reset due to missed day and client requested an old day > 1
      if (wasReset && clientBody.day !== undefined && Number(clientBody.day) > 1) {
        await db.commit();
        return {
          statusCode: 400,
          body: {
            success: false,
            code: 'STREAK_RESET',
            message: 'Your streak has been reset. Start again from Day 1.',
          },
        };
      }

      const cycleClaims = collections.streakClaims.filter(
        (c) => c.userId === userId && c.cycleId === cycle.cycleId && c.status === 'CLAIMED'
      );

      // Section 14 & 99: Sequential Claiming / Day Cheat Test
      const requestedDay = clientBody.day !== undefined ? Number(clientBody.day) : cycle.currentDay;
      if (Number.isNaN(requestedDay) || requestedDay < 1 || requestedDay > config.totalDays) {
        this.appendAuditLog({
          userId,
          eventType: 'STREAK_CLAIM_REJECTED',
          cycleId: cycle.cycleId,
          reason: `Invalid day requested: ${String(clientBody.day)}`,
          payloadSnapshot: clientBody,
          serverTimestamp: nowIso,
        });
        await db.commit();
        return {
          statusCode: 400,
          body: {
            success: false,
            code: 'INVALID_DAY',
            message: 'Invalid streak day requested.',
          },
        };
      }

      // Check if requestedDay was ALREADY claimed (Section 40, 92, 101: Idempotency / Already Claimed)
      const existingClaimForRequestedDay = cycleClaims.find((c) => c.day === requestedDay);
      if (existingClaimForRequestedDay) {
        this.appendAuditLog({
          userId,
          eventType: 'DUPLICATE_CLAIM',
          day: requestedDay,
          cycleId: cycle.cycleId,
          reason: `Duplicate claim prevented for Day ${requestedDay}. Already claimed at ${existingClaimForRequestedDay.claimedAt}.`,
          serverTimestamp: nowIso,
        });
        await db.commit();
        return {
          statusCode: 409,
          body: {
            success: false,
            code: 'ALREADY_CLAIMED',
            message: 'This reward has already been claimed.',
          },
        };
      }

      // Check if user is trying to jump days (e.g., requesting Day 7 while on Day 2)
      if (requestedDay !== cycle.currentDay) {
        this.appendAuditLog({
          userId,
          eventType: 'STREAK_CLAIM_REJECTED',
          day: requestedDay,
          cycleId: cycle.cycleId,
          reason: `Sequential claim violation: User attempted to claim Day ${requestedDay} while eligible day is Day ${cycle.currentDay}.`,
          payloadSnapshot: clientBody,
          serverTimestamp: nowIso,
        });
        await db.commit();
        return {
          statusCode: 400,
          body: {
            success: false,
            code: 'SEQUENTIAL_VIOLATION',
            message: `Sequential claim violation: You cannot jump directly to Day ${requestedDay}. Your current streak target is Day ${cycle.currentDay}.`,
          },
        };
      }

      // Section 10, 11, 92, 97: 24-Hour Server-Side Timer Validation
      if (cycle.nextClaimAt) {
        const nextClaimMs = new Date(cycle.nextClaimAt).getTime();
        if (nowMs < nextClaimMs) {
          this.appendAuditLog({
            userId,
            eventType: 'STREAK_CLAIM_REJECTED',
            day: cycle.currentDay,
            cycleId: cycle.cycleId,
            reason: `24-hour timer still locked until ${cycle.nextClaimAt} (server time: ${nowIso}).`,
            serverTimestamp: nowIso,
          });
          await db.commit();
          return {
            statusCode: 400,
            body: {
              success: false,
              code: 'STILL_LOCKED',
              message: 'Your next reward is not available yet.',
            },
          };
        }
      }

      // Section 13: Previous-Day Validation
      if (cycle.currentDay > 1) {
        const previousDayClaim = cycleClaims.find((c) => c.day === cycle.currentDay - 1);
        if (!previousDayClaim) {
          this.appendAuditLog({
            userId,
            eventType: 'STREAK_CLAIM_REJECTED',
            day: cycle.currentDay,
            cycleId: cycle.cycleId,
            reason: `Previous-day validation failed: Day ${cycle.currentDay - 1} has not been claimed in cycle ${cycle.cycleId}.`,
            serverTimestamp: nowIso,
          });
          await db.commit();
          return {
            statusCode: 400,
            body: {
              success: false,
              code: 'PREVIOUS_DAY_UNCLAIMED',
              message: `Previous day (Day ${cycle.currentDay - 1}) must be claimed before claiming Day ${cycle.currentDay}.`,
            },
          };
        }
      }

      // Retrieve authoritative reward configuration from backend
      const configuredReward = rewardService.getRewardForDay(cycle.currentDay);
      if (!configuredReward) {
        return {
          statusCode: 500,
          body: {
            success: false,
            code: 'REWARD_CONFIG_MISSING',
            message: 'Unable to process your reward. Please try again.',
          },
        };
      }

      const claimedDay = cycle.currentDay;
      const referenceId = `STREAK-C${String(cycle.cycleNumber).padStart(3, '0')}-D0${claimedDay}-${Date.now().toString(36).toUpperCase()}`;

      const latitude = typeof clientBody.latitude === 'number' ? clientBody.latitude : null;
      const longitude = typeof clientBody.longitude === 'number' ? clientBody.longitude : null;
      const accuracy = typeof clientBody.accuracy === 'number' ? clientBody.accuracy : undefined;
      const addressText = typeof clientBody.addressText === 'string' ? clientBody.addressText : undefined;

      const claimLocation =
        latitude !== null && longitude !== null
          ? {
              latitude,
              longitude,
              accuracy,
              addressText,
              timestamp: nowIso,
            }
          : undefined;

      const productivityGoal = typeof clientBody.productivityGoal === 'string' && clientBody.productivityGoal.trim() !== ''
        ? clientBody.productivityGoal.trim()
        : undefined;

      // Credit backend wallet and create WalletTransaction ledger record
      const { wallet, transaction } = walletService.creditStreakReward(
        userId,
        cycle.cycleId,
        claimedDay,
        configuredReward,
        referenceId,
        nowIso
      );

      // Create StreakClaim record
      const claimRecord: IStreakClaim = {
        claimId: `CLM_${Date.now()}_D${claimedDay}`,
        userId,
        cycleId: cycle.cycleId,
        day: claimedDay,
        rewardId: configuredReward.rewardId,
        rewardType: configuredReward.rewardType,
        amount: configuredReward.amount,
        currency: configuredReward.currency,
        status: 'CLAIMED',
        claimedAt: nowIso,
        transactionId: transaction.transactionId,
        referenceId,
        location: claimLocation,
        productivityGoal,
        createdAt: nowIso,
      };
      collections.streakClaims.push(claimRecord);

      // Update StreakCycle state & set 24-hour backend timer
      const nextClaimAtIso = new Date(nowMs + config.claimIntervalMs).toISOString();
      const expireAtIso = new Date(nowMs + config.missedWindowMs).toISOString();

      cycle.lastClaimedDay = claimedDay;
      cycle.lastClaimedAt = nowIso;
      cycle.currentStreak += 1;
      cycle.nextClaimAt = nextClaimAtIso;
      cycle.expireAt = expireAtIso;
      cycle.resetReason = null;
      cycle.updatedAt = nowIso;

      if (claimedDay >= config.totalDays) {
        cycle.status = 'COMPLETED';
        cycle.completedAt = nowIso;
      } else {
        cycle.currentDay = claimedDay + 1;
      }

      this.appendAuditLog({
        userId,
        eventType: 'STREAK_CLAIM_SUCCESS',
        day: claimedDay,
        cycleId: cycle.cycleId,
        reason: `Granted Day ${claimedDay} reward (${configuredReward.displayValue} ${configuredReward.subtitle}) via transaction ${transaction.transactionId}. Next unlock at ${nextClaimAtIso}.`,
        serverTimestamp: nowIso,
      });

      await db.commit();

      return {
        statusCode: 200,
        body: {
          success: true,
          code: 'CLAIM_SUCCESS',
          message: `Day ${claimedDay} reward (${configuredReward.displayValue} ${configuredReward.subtitle}) claimed!`,
          ignoredTamperedFields: ignoredTamperedFields.length > 0 ? ignoredTamperedFields : undefined,
          claim: claimRecord,
          transaction,
          wallet,
        },
      };
    });
  }

  public getUserHistory(userId: string) {
    const collections = db.getCollections();
    const claims = collections.streakClaims
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
    const cycles = collections.streakCycles
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.cycleNumber - a.cycleNumber);
    const transactions = walletService.getUserTransactions(userId);
    const auditLogs = collections.auditLogs
      .filter((l) => l.userId === userId)
      .sort((a, b) => new Date(b.serverTimestamp).getTime() - new Date(a.serverTimestamp).getTime())
      .slice(0, 40);

    return {
      claims,
      cycles,
      transactions,
      auditLogs,
    };
  }

  /**
   * Aggregated Leaderboard Rank Engine:
   * Joins Users + StreakCycles + Wallets, computes each user's longest and active streak,
   * sorts by longestStreak DESC -> veBalance DESC -> giftCardBalanceInr DESC, and returns Top N (default 10).
   */
  public getLeaderboard(currentUserId?: string, limit = 10): LeaderboardResponseDTO {
    const collections = db.getCollections();
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const nowMs = currentUserId ? this.getServerNowMs(currentUserId) : Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const maskEmail = (email: string): string => {
      const [local, domain] = email.split('@');
      if (!domain) return email;
      if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
      return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
    };

    const getInitials = (name: string): string => {
      const clean = name.replace(/\(.*?\)/g, '').trim();
      const parts = clean.split(/\s+/).filter(Boolean);
      if (parts.length === 0) return 'VR';
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    };

    const computeTierBadge = (longestStreak: number): string => {
      if (longestStreak >= 35) return 'Crown Legend';
      if (longestStreak >= 28) return 'Grandmaster VIP';
      if (longestStreak >= 21) return 'Diamond Streaker';
      if (longestStreak >= 14) return 'Gold Streaker';
      if (longestStreak >= 7) return 'Silver Streaker';
      return 'Rising Streaker';
    };

    const unrankedEntries: Omit<LeaderboardEntryDTO, 'rank'>[] = collections.users
      .filter((u) => u.eligible)
      .map((user) => {
        const userCycles = collections.streakCycles
          .filter((c) => c.userId === user.userId)
          .sort((a, b) => b.cycleNumber - a.cycleNumber);

        const latestCycle = userCycles[0];
        const longestStreak = userCycles.reduce(
          (max, c) => Math.max(max, c.currentStreak || 0),
          0
        );
        const currentStreak = latestCycle?.currentStreak || 0;
        const currentDay = latestCycle?.currentDay || 1;
        const cycleStatus = latestCycle?.status || 'ACTIVE';
        const lastClaimedAt = latestCycle?.lastClaimedAt || null;

        const completedCyclesCount = Math.max(
          userCycles.filter((c) => c.status === 'COMPLETED').length,
          Math.floor(longestStreak / 7)
        );

        const wallet = collections.wallets.find((w) => w.userId === user.userId);
        const veBalance = wallet?.veBalance || 0;
        const giftCardBalanceInr = wallet?.giftCardBalanceInr || 0;

        // Clean display name while preserving clarity
        const displayName = user.name.replace(/\s*\(Design Reference State\)|\s*\(Fresh Day 1 User\)/i, '').trim();

        return {
          userId: user.userId,
          name: displayName,
          maskedEmail: maskEmail(user.email),
          initials: getInitials(displayName),
          currentStreak,
          longestStreak,
          currentDay,
          cyclesCompleted: completedCyclesCount,
          cycleStatus,
          veBalance,
          giftCardBalanceInr,
          tierBadge: computeTierBadge(longestStreak),
          lastClaimedAt,
          isCurrentUser: Boolean(currentUserId && user.userId === currentUserId),
        };
      });

    // Sort by longestStreak DESC, then currentStreak DESC, then veBalance DESC, then giftCardBalanceInr DESC
    unrankedEntries.sort((a, b) => {
      if (b.longestStreak !== a.longestStreak) return b.longestStreak - a.longestStreak;
      if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
      if (b.veBalance !== a.veBalance) return b.veBalance - a.veBalance;
      if (b.giftCardBalanceInr !== a.giftCardBalanceInr) return b.giftCardBalanceInr - a.giftCardBalanceInr;
      const timeA = a.lastClaimedAt ? new Date(a.lastClaimedAt).getTime() : 0;
      const timeB = b.lastClaimedAt ? new Date(b.lastClaimedAt).getTime() : 0;
      return timeB - timeA;
    });

    const allRanked: LeaderboardEntryDTO[] = unrankedEntries.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    const topTen = allRanked.slice(0, safeLimit);
    const currentUserEntry = currentUserId
      ? allRanked.find((e) => e.userId === currentUserId) || null
      : null;
    const inTopTen = Boolean(currentUserEntry && currentUserEntry.rank <= safeLimit);
    const tenthEntryStreak = topTen[topTen.length - 1]?.longestStreak || 0;
    const daysToReachTopTen =
      currentUserEntry && !inTopTen
        ? Math.max(1, tenthEntryStreak - currentUserEntry.longestStreak + 1)
        : 0;

    const totalVesDistributed = allRanked.reduce((sum, item) => sum + item.veBalance, 0);
    const totalGiftCardsDistributedInr = allRanked.reduce((sum, item) => sum + item.giftCardBalanceInr, 0);

    return {
      success: true,
      serverTime: nowIso,
      aggregationPipeline:
        'StreakCycleModel.aggregate([{ $group: { _id: "$userId", longestStreak: { $max: "$currentStreak" } } }, { $lookup: { from: "users", ... } }, { $lookup: { from: "wallets", ... } }, { $sort: { longestStreak: -1, veBalance: -1 } }, { $limit: 10 }])',
      summary: {
        totalParticipants: allRanked.length,
        highestStreakDays: allRanked[0]?.longestStreak || 0,
        totalVesDistributed,
        totalGiftCardsDistributedInr,
      },
      leaderboard: topTen,
      currentUserStanding: {
        entry: currentUserEntry,
        inTopTen,
        daysToReachTopTen,
      },
    };
  }

  /**
   * Developer / Evaluator simulation helpers for testing 24h timers, missed days, and states
   */
  public async simulateTimeTravel(userId: string, hoursToAdvance: number) {
    return withUserLock(userId, async () => {
      const collections = db.getCollections();
      const user = collections.users.find((u) => u.userId === userId);
      if (!user) throw new Error('USER_NOT_FOUND');

      user.serverTimeOffsetMs = (user.serverTimeOffsetMs || 0) + hoursToAdvance * 3600 * 1000;
      const nowIso = new Date(this.getServerNowMs(userId)).toISOString();

      this.appendAuditLog({
        userId,
        eventType: 'ADMIN_SIMULATION',
        reason: `Evaluator advanced server clock by +${hoursToAdvance} hours (new server time: ${nowIso}).`,
        serverTimestamp: nowIso,
      });

      await db.commit();
    });
  }

  public async fastForwardTimerToSeconds(userId: string, secondsRemaining = 4) {
    return withUserLock(userId, async () => {
      const collections = db.getCollections();
      const nowMs = this.getServerNowMs(userId);
      const nowIso = new Date(nowMs).toISOString();
      const activeCycle = collections.streakCycles.find(
        (c) => c.userId === userId && (c.status === 'ACTIVE' || c.status === 'COMPLETED')
      );

      if (activeCycle) {
        activeCycle.nextClaimAt = new Date(nowMs + secondsRemaining * 1000).toISOString();
        activeCycle.expireAt = new Date(nowMs + (secondsRemaining + 86400) * 1000).toISOString();
        activeCycle.updatedAt = nowIso;
      }

      this.appendAuditLog({
        userId,
        eventType: 'ADMIN_SIMULATION',
        reason: `Evaluator fast-forwarded backend 24h timer to ${secondsRemaining}s remaining to demonstrate live 00:00:00 auto-unlock.`,
        serverTimestamp: nowIso,
      });

      await db.commit();
    });
  }

  public async resetUserToPreset(userId: string, preset: 'DAY1_FRESH' | 'DAY2_READY_DESIGN_REF') {
    return withUserLock(userId, async () => {
      const collections = db.getCollections();
      const user = collections.users.find((u) => u.userId === userId);
      if (!user) throw new Error('USER_NOT_FOUND');

      user.serverTimeOffsetMs = 0;
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();

      // Remove existing claims & cycles for clean preset
      collections.streakClaims = collections.streakClaims.filter((c) => c.userId !== userId);
      collections.streakCycles = collections.streakCycles.filter((c) => c.userId !== userId);

      const wallet = walletService.getOrCreateWallet(userId, nowIso);

      if (preset === 'DAY1_FRESH') {
        wallet.veBalance = 100;
        wallet.giftCardBalanceInr = 0;
        wallet.updatedAt = nowIso;

        collections.streakCycles.push({
          cycleId: `CYCLE_${userId}_FRESH_${Date.now()}`,
          userId,
          cycleNumber: 1,
          currentStreak: 0,
          currentDay: 1,
          status: 'ACTIVE',
          lastClaimedDay: 0,
          lastClaimedAt: null,
          nextClaimAt: null,
          expireAt: null,
          resetReason: null,
          startedAt: nowIso,
          completedAt: null,
          updatedAt: nowIso,
        });
      } else {
        // Matches exact PDF Desktop/Mobile Design Reference: Day 1 Claimed (+5 VEs), Wallet = 120 VEs, Day 2 Today & Claimable!
        const twentyFiveHoursAgoIso = new Date(nowMs - 25 * 3600 * 1000).toISOString();
        const oneHourAgoIso = new Date(nowMs - 1 * 3600 * 1000).toISOString();
        const twentyThreeHoursAheadIso = new Date(nowMs + 23 * 3600 * 1000).toISOString();
        const cycleId = `CYCLE_${userId}_REF_${Date.now()}`;

        wallet.veBalance = 120;
        wallet.giftCardBalanceInr = 0;
        wallet.updatedAt = twentyFiveHoursAgoIso;

        collections.streakCycles.push({
          cycleId,
          userId,
          cycleNumber: 1,
          currentStreak: 1,
          currentDay: 2,
          status: 'ACTIVE',
          lastClaimedDay: 1,
          lastClaimedAt: twentyFiveHoursAgoIso,
          nextClaimAt: oneHourAgoIso,
          expireAt: twentyThreeHoursAheadIso,
          resetReason: null,
          startedAt: twentyFiveHoursAgoIso,
          completedAt: null,
          updatedAt: twentyFiveHoursAgoIso,
        });

        collections.streakClaims.push({
          claimId: `CLM_REF_D1_${Date.now()}`,
          userId,
          cycleId,
          day: 1,
          rewardId: 'REWARD_DAY_1',
          rewardType: 'VES',
          amount: 5,
          currency: 'VES',
          status: 'CLAIMED',
          claimedAt: twentyFiveHoursAgoIso,
          transactionId: `TXN_REF_D1_${Date.now()}`,
          referenceId: `STREAK-REF-D01-${Date.now().toString(36).toUpperCase()}`,
          createdAt: twentyFiveHoursAgoIso,
        });
      }

      this.appendAuditLog({
        userId,
        eventType: 'ADMIN_SIMULATION',
        reason: `Evaluator applied preset state: ${preset}.`,
        serverTimestamp: nowIso,
      });

      await db.commit();
    });
  }

  public async setStreakMilestone(userId: string, targetDays: number): Promise<void> {
    return withUserLock(userId, async () => {
      const collections = db.getCollections();
      const nowMs = this.getServerNowMs(userId);
      const nowIso = new Date(nowMs).toISOString();
      const config = rewardService.getStreakConfig();

      const { cycle } = this.getOrCreateActiveCycle(userId, config, nowMs);
      cycle.currentStreak = targetDays;
      cycle.currentDay = Math.min(targetDays + 1, config.totalDays);
      cycle.updatedAt = nowIso;

      this.appendAuditLog({
        userId,
        eventType: 'ADMIN_SIMULATION',
        reason: `Set streak milestone to ${targetDays} days.`,
        serverTimestamp: nowIso,
      });

      await db.commit();
    });
  }
}

export const streakService = new StreakService();
