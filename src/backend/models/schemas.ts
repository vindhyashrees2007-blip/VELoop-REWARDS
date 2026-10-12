import mongoose, { Schema, Document } from 'mongoose';

export type RewardType = 'VES' | 'GIFT_CARD';
export type CurrencyType = 'VES' | 'INR';
export type AssetType = 'coin' | 'gift-box' | 'gift-card' | 'crown';
export type CardStatus = 'LOCKED' | 'AVAILABLE' | 'TODAY' | 'CLAIMED' | 'MISSED';
export type CycleStatus = 'ACTIVE' | 'COMPLETED' | 'RESET';
export type AuditEventType =
  | 'STREAK_CLAIM_REQUEST'
  | 'STREAK_CLAIM_SUCCESS'
  | 'STREAK_CLAIM_REJECTED'
  | 'STREAK_RESET'
  | 'DUPLICATE_CLAIM'
  | 'INVALID_CLAIM'
  | 'AUTH_LOGIN'
  | 'ADMIN_SIMULATION';

export interface IUser {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  eligible: boolean;
  serverTimeOffsetMs: number;
  createdAt: string;
}

export interface IWallet {
  userId: string;
  veBalance: number;
  giftCardBalanceInr: number;
  updatedAt: string;
}

export interface IStreakConfig {
  configId: string;
  totalDays: number;
  claimIntervalMs: number;
  missedWindowMs: number;
  resetOnMiss: boolean;
  active: boolean;
  updatedAt: string;
}

export interface IStreakReward {
  rewardId: string;
  day: number;
  rewardType: RewardType;
  currency: CurrencyType;
  amount: number;
  displayValue: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string | null;
  assetType: AssetType;
  isUltimate: boolean;
  active: boolean;
  metadata: Record<string, unknown>;
}

export interface IStreakCycle {
  cycleId: string;
  userId: string;
  cycleNumber: number;
  currentStreak: number;
  currentDay: number;
  status: CycleStatus;
  lastClaimedDay: number;
  lastClaimedAt: string | null;
  nextClaimAt: string | null;
  expireAt: string | null;
  resetReason?: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface IStreakClaim {
  claimId: string;
  userId: string;
  cycleId: string;
  day: number;
  rewardId: string;
  rewardType: RewardType;
  amount: number;
  currency: CurrencyType;
  status: 'CLAIMED';
  claimedAt: string;
  transactionId: string;
  referenceId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    addressText?: string;
    timestamp?: string;
  };
  productivityGoal?: string;
  createdAt: string;
}

export interface IWalletTransaction {
  transactionId: string;
  userId: string;
  currency: CurrencyType;
  rewardType: RewardType;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  source: 'DAILY_STREAK' | 'INITIAL_BONUS';
  streakDay: number;
  cycleId: string;
  referenceId: string;
  balanceBefore: number;
  balanceAfter: number;
  status: 'COMPLETED';
  createdAt: string;
}

export interface IAuditLog {
  logId: string;
  userId: string;
  eventType: AuditEventType;
  day?: number;
  cycleId?: string;
  reason: string;
  payloadSnapshot?: Record<string, unknown>;
  serverTimestamp: string;
}

// Mongoose Schemas for MongoDB Atlas / Mongoose Persistence
const UserSchema = new Schema<IUser & Document>({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  eligible: { type: Boolean, default: true },
  serverTimeOffsetMs: { type: Number, default: 0 },
  createdAt: { type: String, required: true },
});

const WalletSchema = new Schema<IWallet & Document>({
  userId: { type: String, required: true, unique: true, index: true },
  veBalance: { type: Number, required: true, default: 0 },
  giftCardBalanceInr: { type: Number, required: true, default: 0 },
  updatedAt: { type: String, required: true },
});

const StreakConfigSchema = new Schema<IStreakConfig & Document>({
  configId: { type: String, required: true, unique: true },
  totalDays: { type: Number, required: true, default: 7 },
  claimIntervalMs: { type: Number, required: true, default: 86400000 },
  missedWindowMs: { type: Number, required: true, default: 172800000 },
  resetOnMiss: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  updatedAt: { type: String, required: true },
});

const StreakRewardSchema = new Schema<IStreakReward & Document>({
  rewardId: { type: String, required: true, unique: true },
  day: { type: Number, required: true, unique: true, index: true },
  rewardType: { type: String, enum: ['VES', 'GIFT_CARD'], required: true },
  currency: { type: String, enum: ['VES', 'INR'], required: true },
  amount: { type: Number, required: true },
  displayValue: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  badge: { type: String, default: null },
  assetType: { type: String, enum: ['coin', 'gift-box', 'gift-card', 'crown'], required: true },
  isUltimate: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const StreakCycleSchema = new Schema<IStreakCycle & Document>({
  cycleId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  cycleNumber: { type: Number, required: true },
  currentStreak: { type: Number, required: true, default: 0 },
  currentDay: { type: Number, required: true, default: 1 },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'RESET'], default: 'ACTIVE' },
  lastClaimedDay: { type: Number, default: 0 },
  lastClaimedAt: { type: String, default: null },
  nextClaimAt: { type: String, default: null },
  expireAt: { type: String, default: null },
  resetReason: { type: String, default: null },
  startedAt: { type: String, required: true },
  completedAt: { type: String, default: null },
  updatedAt: { type: String, required: true },
});

const StreakClaimSchema = new Schema<IStreakClaim & Document>({
  claimId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  cycleId: { type: String, required: true, index: true },
  day: { type: Number, required: true },
  rewardId: { type: String, required: true },
  rewardType: { type: String, enum: ['VES', 'GIFT_CARD'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['VES', 'INR'], required: true },
  status: { type: String, enum: ['CLAIMED'], default: 'CLAIMED' },
  claimedAt: { type: String, required: true },
  transactionId: { type: String, required: true },
  referenceId: { type: String, required: true },
  createdAt: { type: String, required: true },
});

// Critical unique compound constraint: userId + cycleId + day (prevents duplicate claims)
StreakClaimSchema.index({ userId: 1, cycleId: 1, day: 1 }, { unique: true });

const WalletTransactionSchema = new Schema<IWalletTransaction & Document>({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  currency: { type: String, enum: ['VES', 'INR'], required: true },
  rewardType: { type: String, enum: ['VES', 'GIFT_CARD'], required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], default: 'CREDIT' },
  amount: { type: Number, required: true },
  source: { type: String, enum: ['DAILY_STREAK', 'INITIAL_BONUS'], default: 'DAILY_STREAK' },
  streakDay: { type: Number, required: true },
  cycleId: { type: String, required: true },
  referenceId: { type: String, required: true, unique: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  status: { type: String, enum: ['COMPLETED'], default: 'COMPLETED' },
  createdAt: { type: String, required: true },
});

const AuditLogSchema = new Schema<IAuditLog & Document>({
  logId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  eventType: { type: String, required: true },
  day: { type: Number },
  cycleId: { type: String },
  reason: { type: String, required: true },
  payloadSnapshot: { type: Schema.Types.Mixed },
  serverTimestamp: { type: String, required: true },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser & Document>('User', UserSchema);
export const WalletModel = mongoose.models.Wallet || mongoose.model<IWallet & Document>('Wallet', WalletSchema);
export const StreakConfigModel =
  mongoose.models.StreakConfig || mongoose.model<IStreakConfig & Document>('StreakConfig', StreakConfigSchema);
export const StreakRewardModel =
  mongoose.models.StreakReward || mongoose.model<IStreakReward & Document>('StreakReward', StreakRewardSchema);
export const StreakCycleModel =
  mongoose.models.StreakCycle || mongoose.model<IStreakCycle & Document>('StreakCycle', StreakCycleSchema);
export const StreakClaimModel =
  mongoose.models.StreakClaim || mongoose.model<IStreakClaim & Document>('StreakClaim', StreakClaimSchema);
export const WalletTransactionModel =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction & Document>('WalletTransaction', WalletTransactionSchema);
export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model<IAuditLog & Document>('AuditLog', AuditLogSchema);
