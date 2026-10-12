import { db } from '../config/db.ts';
import { IStreakReward, IWallet, IWalletTransaction } from '../models/schemas.ts';

export class WalletService {
  public getOrCreateWallet(userId: string, nowIso: string): IWallet {
    const collections = db.getCollections();
    let wallet = collections.wallets.find((w) => w.userId === userId);
    if (!wallet) {
      wallet = {
        userId,
        veBalance: 100,
        giftCardBalanceInr: 0,
        updatedAt: nowIso,
      };
      collections.wallets.push(wallet);
    }
    return wallet;
  }

  public creditStreakReward(
    userId: string,
    cycleId: string,
    day: number,
    reward: IStreakReward,
    referenceId: string,
    nowIso: string
  ): { wallet: IWallet; transaction: IWalletTransaction } {
    const collections = db.getCollections();
    const wallet = this.getOrCreateWallet(userId, nowIso);

    const isVeCurrency = reward.currency === 'VES';
    const balanceBefore = isVeCurrency ? wallet.veBalance : wallet.giftCardBalanceInr;
    const balanceAfter = balanceBefore + reward.amount;

    if (isVeCurrency) {
      wallet.veBalance = balanceAfter;
    } else {
      wallet.giftCardBalanceInr = balanceAfter;
    }
    wallet.updatedAt = nowIso;

    const transaction: IWalletTransaction = {
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      userId,
      currency: reward.currency,
      rewardType: reward.rewardType,
      type: 'CREDIT',
      amount: reward.amount,
      source: 'DAILY_STREAK',
      streakDay: day,
      cycleId,
      referenceId,
      balanceBefore,
      balanceAfter,
      status: 'COMPLETED',
      createdAt: nowIso,
    };

    collections.walletTransactions.push(transaction);
    return { wallet, transaction };
  }

  public getUserTransactions(userId: string): IWalletTransaction[] {
    const { walletTransactions } = db.getCollections();
    return walletTransactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const walletService = new WalletService();
