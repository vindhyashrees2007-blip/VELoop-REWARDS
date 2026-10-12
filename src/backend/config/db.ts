import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  IUser,
  IWallet,
  IStreakConfig,
  IStreakReward,
  IStreakCycle,
  IStreakClaim,
  IWalletTransaction,
  IAuditLog,
  UserModel,
  WalletModel,
  StreakConfigModel,
  StreakRewardModel,
  StreakCycleModel,
  StreakClaimModel,
  WalletTransactionModel,
  AuditLogModel,
} from '../models/schemas.ts';

export interface DatabaseCollections {
  users: IUser[];
  wallets: IWallet[];
  streakConfigs: IStreakConfig[];
  streakRewards: IStreakReward[];
  streakCycles: IStreakCycle[];
  streakClaims: IStreakClaim[];
  walletTransactions: IWalletTransaction[];
  auditLogs: IAuditLog[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), '.veloop-mongodb-store.json');

const userLocks = new Map<string, Promise<unknown>>();

/**
 * Atomic per-user lock to prevent race conditions during concurrent POST /claim requests
 */
export async function withUserLock<T>(userId: string, task: () => Promise<T>): Promise<T> {
  const previous = userLocks.get(userId) || Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  userLocks.set(
    userId,
    previous.then(() => current)
  );

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (userLocks.get(userId) === current) {
      userLocks.delete(userId);
    }
  }
}

export const INITIAL_STREAK_REWARDS: IStreakReward[] = [
  {
    rewardId: 'REWARD_DAY_1',
    day: 1,
    rewardType: 'VES',
    currency: 'VES',
    amount: 5,
    displayValue: '+5',
    title: 'Daily Reward',
    subtitle: '5 VEs',
    description: 'Day 1 check-in reward of 5 VEs credited directly to your VELoop Wallet.',
    badge: null,
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'standard', glow: 'emerald' },
  },
  {
    rewardId: 'REWARD_DAY_2',
    day: 2,
    rewardType: 'VES',
    currency: 'VES',
    amount: 10,
    displayValue: '+10',
    title: 'Daily Reward',
    subtitle: '10 VEs',
    description: 'Day 2 consecutive check-in bonus of 10 VEs.',
    badge: null,
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'standard', glow: 'gold' },
  },
  {
    rewardId: 'REWARD_DAY_3',
    day: 3,
    rewardType: 'VES',
    currency: 'VES',
    amount: 15,
    displayValue: '+15',
    title: 'Daily Reward',
    subtitle: '15 VEs',
    description: 'Day 3 consecutive check-in bonus of 15 VEs.',
    badge: null,
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'standard', glow: 'purple' },
  },
  {
    rewardId: 'REWARD_DAY_4',
    day: 4,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 1,
    displayValue: '₹1',
    title: 'Daily Reward',
    subtitle: 'Amazon Gift Card',
    description: 'Day 4 mid-week milestone: ₹1 Amazon Gift Card voucher.',
    badge: null,
    assetType: 'gift-box',
    isUltimate: false,
    active: true,
    metadata: { tier: 'milestone', brand: 'Amazon' },
  },
  {
    rewardId: 'REWARD_DAY_5',
    day: 5,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 2,
    displayValue: '₹2',
    title: 'Daily Reward',
    subtitle: 'Amazon Gift Card',
    description: 'Day 5 streak reward: ₹2 Amazon Gift Card voucher.',
    badge: 'Gift Card',
    assetType: 'gift-card',
    isUltimate: false,
    active: true,
    metadata: { tier: 'milestone', brand: 'Amazon' },
  },
  {
    rewardId: 'REWARD_DAY_6',
    day: 6,
    rewardType: 'VES',
    currency: 'VES',
    amount: 30,
    displayValue: '+30',
    title: 'Daily Reward',
    subtitle: '30 VEs',
    description: 'Day 6 mega coin drop: 30 VEs credited to your VELoop Wallet.',
    badge: 'Coin',
    assetType: 'coin',
    isUltimate: false,
    active: true,
    metadata: { tier: 'boost', glow: 'purple' },
  },
  {
    rewardId: 'REWARD_DAY_7',
    day: 7,
    rewardType: 'GIFT_CARD',
    currency: 'INR',
    amount: 5,
    displayValue: '₹5',
    title: 'Ultimate Reward',
    subtitle: 'Amazon Gift Card',
    description: 'Day 7 Ultimate Streak Reward: ₹5 Amazon Gift Card for completing 7 consecutive days!',
    badge: 'VIP',
    assetType: 'crown',
    isUltimate: true,
    active: true,
    metadata: { tier: 'ultimate', brand: 'Amazon', unlockText: 'Unlock on Day 7' },
  },
];

function createInitialSeedData(): DatabaseCollections {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  // Day 1 claimed 25 hours ago for the primary Demo User so Day 2 is TODAY & AVAILABLE immediately (matches PDF design reference!)
  const twentyFiveHoursAgoIso = new Date(nowMs - 25 * 3600 * 1000).toISOString();
  const oneHourAgoIso = new Date(nowMs - 1 * 3600 * 1000).toISOString();
  const twentyThreeHoursAheadIso = new Date(nowMs + 23 * 3600 * 1000).toISOString();

  const users: IUser[] = [
    {
      userId: 'USR_VELOOP_01',
      email: 'demo@velooprewards.in',
      name: 'Aarav Sharma (Design Reference State)',
      passwordHash: 'veloop_hashed_demo123',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_VELOOP_02',
      email: 'fresh@velooprewards.in',
      name: 'Priya Patel (Fresh Day 1 User)',
      passwordHash: 'veloop_hashed_fresh123',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: nowIso,
    },
    {
      userId: 'USR_LDR_01',
      email: 'vikram.rao@velooprewards.in',
      name: 'Vikramaditya Rao',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_02',
      email: 'ananya.iyer@velooprewards.in',
      name: 'Ananya Iyer',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_03',
      email: 'rohan.verma@velooprewards.in',
      name: 'Rohan Verma',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_04',
      email: 'meera.krishnan@velooprewards.in',
      name: 'Meera Krishnan',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_05',
      email: 'kabir.malhotra@velooprewards.in',
      name: 'Kabir Malhotra',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_06',
      email: 'sneha.reddy@velooprewards.in',
      name: 'Sneha Reddy',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_07',
      email: 'aditya.nair@velooprewards.in',
      name: 'Aditya Nair',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_08',
      email: 'divya.menon@velooprewards.in',
      name: 'Divya Menon',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_09',
      email: 'siddharth.joshi@velooprewards.in',
      name: 'Siddharth Joshi',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_LDR_10',
      email: 'tanvi.deshmukh@velooprewards.in',
      name: 'Tanvi Deshmukh',
      passwordHash: 'veloop_hashed_ldr',
      eligible: true,
      serverTimeOffsetMs: 0,
      createdAt: twentyFiveHoursAgoIso,
    },
  ];

  const wallets: IWallet[] = [
    {
      userId: 'USR_VELOOP_01',
      veBalance: 120,
      giftCardBalanceInr: 0,
      updatedAt: twentyFiveHoursAgoIso,
    },
    {
      userId: 'USR_VELOOP_02',
      veBalance: 100,
      giftCardBalanceInr: 0,
      updatedAt: nowIso,
    },
    { userId: 'USR_LDR_01', veBalance: 1680, giftCardBalanceInr: 48, updatedAt: nowIso },
    { userId: 'USR_LDR_02', veBalance: 1420, giftCardBalanceInr: 40, updatedAt: nowIso },
    { userId: 'USR_LDR_03', veBalance: 1190, giftCardBalanceInr: 32, updatedAt: nowIso },
    { userId: 'USR_LDR_04', veBalance: 960, giftCardBalanceInr: 24, updatedAt: nowIso },
    { userId: 'USR_LDR_05', veBalance: 820, giftCardBalanceInr: 19, updatedAt: nowIso },
    { userId: 'USR_LDR_06', veBalance: 680, giftCardBalanceInr: 16, updatedAt: nowIso },
    { userId: 'USR_LDR_07', veBalance: 540, giftCardBalanceInr: 11, updatedAt: nowIso },
    { userId: 'USR_LDR_08', veBalance: 430, giftCardBalanceInr: 8, updatedAt: nowIso },
    { userId: 'USR_LDR_09', veBalance: 360, giftCardBalanceInr: 8, updatedAt: nowIso },
    { userId: 'USR_LDR_10', veBalance: 275, giftCardBalanceInr: 3, updatedAt: nowIso },
  ];

  const streakConfigs: IStreakConfig[] = [
    {
      configId: 'DEFAULT_STREAK_CONFIG',
      totalDays: 7,
      claimIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
      missedWindowMs: 48 * 60 * 60 * 1000, // 48 hours from last claim (24h lock + 24h claim window)
      resetOnMiss: true,
      active: true,
      updatedAt: nowIso,
    },
  ];

  const streakCycles: IStreakCycle[] = [
    {
      cycleId: 'CYCLE_USR01_001',
      userId: 'USR_VELOOP_01',
      cycleNumber: 1,
      currentStreak: 1,
      currentDay: 2,
      status: 'ACTIVE',
      lastClaimedDay: 1,
      lastClaimedAt: twentyFiveHoursAgoIso,
      nextClaimAt: oneHourAgoIso, // Unlocked 1 hour ago so Day 2 is claimable right now!
      expireAt: twentyThreeHoursAheadIso,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: twentyFiveHoursAgoIso,
    },
    {
      cycleId: 'CYCLE_USR02_001',
      userId: 'USR_VELOOP_02',
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
    },
    {
      cycleId: 'CYCLE_LDR_01',
      userId: 'USR_LDR_01',
      cycleNumber: 6,
      currentStreak: 42,
      currentDay: 7,
      status: 'COMPLETED',
      lastClaimedDay: 7,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: oneHourAgoIso,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_02',
      userId: 'USR_LDR_02',
      cycleNumber: 5,
      currentStreak: 35,
      currentDay: 7,
      status: 'COMPLETED',
      lastClaimedDay: 7,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: oneHourAgoIso,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_03',
      userId: 'USR_LDR_03',
      cycleNumber: 4,
      currentStreak: 28,
      currentDay: 7,
      status: 'COMPLETED',
      lastClaimedDay: 7,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: oneHourAgoIso,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_04',
      userId: 'USR_LDR_04',
      cycleNumber: 4,
      currentStreak: 24,
      currentDay: 4,
      status: 'ACTIVE',
      lastClaimedDay: 3,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_05',
      userId: 'USR_LDR_05',
      cycleNumber: 3,
      currentStreak: 19,
      currentDay: 6,
      status: 'ACTIVE',
      lastClaimedDay: 5,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_06',
      userId: 'USR_LDR_06',
      cycleNumber: 3,
      currentStreak: 15,
      currentDay: 2,
      status: 'ACTIVE',
      lastClaimedDay: 1,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_07',
      userId: 'USR_LDR_07',
      cycleNumber: 2,
      currentStreak: 12,
      currentDay: 6,
      status: 'ACTIVE',
      lastClaimedDay: 5,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_08',
      userId: 'USR_LDR_08',
      cycleNumber: 2,
      currentStreak: 9,
      currentDay: 3,
      status: 'ACTIVE',
      lastClaimedDay: 2,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_09',
      userId: 'USR_LDR_09',
      cycleNumber: 1,
      currentStreak: 7,
      currentDay: 7,
      status: 'COMPLETED',
      lastClaimedDay: 7,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: oneHourAgoIso,
      updatedAt: oneHourAgoIso,
    },
    {
      cycleId: 'CYCLE_LDR_10',
      userId: 'USR_LDR_10',
      cycleNumber: 1,
      currentStreak: 5,
      currentDay: 6,
      status: 'ACTIVE',
      lastClaimedDay: 5,
      lastClaimedAt: oneHourAgoIso,
      nextClaimAt: twentyThreeHoursAheadIso,
      expireAt: null,
      resetReason: null,
      startedAt: twentyFiveHoursAgoIso,
      completedAt: null,
      updatedAt: oneHourAgoIso,
    },
  ];

  const streakClaims: IStreakClaim[] = [
    {
      claimId: 'CLM_INIT_DAY1_USR01',
      userId: 'USR_VELOOP_01',
      cycleId: 'CYCLE_USR01_001',
      day: 1,
      rewardId: 'REWARD_DAY_1',
      rewardType: 'VES',
      amount: 5,
      currency: 'VES',
      status: 'CLAIMED',
      claimedAt: twentyFiveHoursAgoIso,
      transactionId: 'TXN_INIT_DAY1_USR01',
      referenceId: 'STREAK-C001-D01',
      createdAt: twentyFiveHoursAgoIso,
    },
  ];

  const walletTransactions: IWalletTransaction[] = [
    {
      transactionId: 'TXN_WELCOME_USR01',
      userId: 'USR_VELOOP_01',
      currency: 'VES',
      rewardType: 'VES',
      type: 'CREDIT',
      amount: 115,
      source: 'INITIAL_BONUS',
      streakDay: 0,
      cycleId: 'CYCLE_USR01_001',
      referenceId: 'WELCOME-BONUS-01',
      balanceBefore: 0,
      balanceAfter: 115,
      status: 'COMPLETED',
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      transactionId: 'TXN_INIT_DAY1_USR01',
      userId: 'USR_VELOOP_01',
      currency: 'VES',
      rewardType: 'VES',
      type: 'CREDIT',
      amount: 5,
      source: 'DAILY_STREAK',
      streakDay: 1,
      cycleId: 'CYCLE_USR01_001',
      referenceId: 'STREAK-C001-D01',
      balanceBefore: 115,
      balanceAfter: 120,
      status: 'COMPLETED',
      createdAt: twentyFiveHoursAgoIso,
    },
    {
      transactionId: 'TXN_WELCOME_USR02',
      userId: 'USR_VELOOP_02',
      currency: 'VES',
      rewardType: 'VES',
      type: 'CREDIT',
      amount: 100,
      source: 'INITIAL_BONUS',
      streakDay: 0,
      cycleId: 'CYCLE_USR02_001',
      referenceId: 'WELCOME-BONUS-02',
      balanceBefore: 0,
      balanceAfter: 100,
      status: 'COMPLETED',
      createdAt: nowIso,
    },
  ];

  const auditLogs: IAuditLog[] = [
    {
      logId: 'AUD_INIT_01',
      userId: 'USR_VELOOP_01',
      eventType: 'STREAK_CLAIM_SUCCESS',
      day: 1,
      cycleId: 'CYCLE_USR01_001',
      reason: 'Day 1 reward (+5 VEs) claimed and credited to wallet.',
      serverTimestamp: twentyFiveHoursAgoIso,
    },
  ];

  return {
    users,
    wallets,
    streakConfigs,
    streakRewards: [...INITIAL_STREAK_REWARDS],
    streakCycles,
    streakClaims,
    walletTransactions,
    auditLogs,
  };
}

class MongoDocumentStore {
  private data: DatabaseCollections;
  public isMongooseConnected = false;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseCollections {
    const seed = createInitialSeedData();
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseCollections;
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.streakRewards)) {
          // Ensure all seeded leaderboard users exist in loaded store
          for (const su of seed.users) {
            if (!parsed.users.some((u) => u.userId === su.userId)) {
              parsed.users.push(su);
            }
          }
          for (const sw of seed.wallets) {
            if (!parsed.wallets.some((w) => w.userId === sw.userId)) {
              parsed.wallets.push(sw);
            }
          }
          for (const sc of seed.streakCycles) {
            if (!parsed.streakCycles.some((c) => c.cycleId === sc.cycleId)) {
              parsed.streakCycles.push(sc);
            }
          }
          this.saveToDisk(parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Initializing fresh VELoop persistent document store:', err);
    }
    this.saveToDisk(seed);
    return seed;
  }

  public saveToDisk(collections: DatabaseCollections = this.data): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(collections, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist document store:', err);
    }
  }

  public async connectMongo(): Promise<void> {
    const uri = (process.env.MONGO_URI || '').trim();
    const hasValidMongoScheme = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');

    if (
      hasValidMongoScheme &&
      uri !== 'MY_MONGO_URI' &&
      !uri.includes('username:password') &&
      !uri.includes('<password>')
    ) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
        this.isMongooseConnected = true;
        console.log('Connected to MongoDB Atlas via Mongoose.');
        await this.syncToMongoose();
      } catch {
        console.log('MongoDB Atlas URI unreachable; running on persistent VELoop Document Engine.');
      }
    } else {
      console.log('Using persistent VELoop Document Engine (.veloop-mongodb-store.json).');
    }
  }

  private async syncToMongoose(): Promise<void> {
    if (!this.isMongooseConnected) return;
    try {
      const rewardCount = await StreakRewardModel.countDocuments();
      if (rewardCount === 0) {
        await StreakRewardModel.insertMany(this.data.streakRewards);
      }
      const configCount = await StreakConfigModel.countDocuments();
      if (configCount === 0) {
        await StreakConfigModel.insertMany(this.data.streakConfigs);
      }
      for (const u of this.data.users) {
        await UserModel.updateOne({ userId: u.userId }, { $setOnInsert: u }, { upsert: true });
      }
      for (const w of this.data.wallets) {
        await WalletModel.updateOne({ userId: w.userId }, { $set: w }, { upsert: true });
      }
      for (const c of this.data.streakCycles) {
        await StreakCycleModel.updateOne({ cycleId: c.cycleId }, { $set: c }, { upsert: true });
      }
      for (const cl of this.data.streakClaims) {
        await StreakClaimModel.updateOne({ claimId: cl.claimId }, { $set: cl }, { upsert: true });
      }
      for (const tx of this.data.walletTransactions) {
        await WalletTransactionModel.updateOne({ transactionId: tx.transactionId }, { $set: tx }, { upsert: true });
      }
      for (const log of this.data.auditLogs.slice(-50)) {
        await AuditLogModel.updateOne({ logId: log.logId }, { $set: log }, { upsert: true });
      }
    } catch (err) {
      console.warn('Mongoose background sync warning:', err);
    }
  }

  public getCollections(): DatabaseCollections {
    return this.data;
  }

  public async commit(): Promise<void> {
    this.saveToDisk(this.data);
    if (this.isMongooseConnected) {
      await this.syncToMongoose();
    }
  }
}

export const db = new MongoDocumentStore();
