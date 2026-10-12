import { db } from '../config/db.ts';
import { IStreakConfig, IStreakReward } from '../models/schemas.ts';

export class RewardService {
  public getStreakConfig(): IStreakConfig {
    const { streakConfigs } = db.getCollections();
    const activeConfig = streakConfigs.find((c) => c.active) || streakConfigs[0];
    return activeConfig;
  }

  public getActiveRewards(): IStreakReward[] {
    const { streakRewards } = db.getCollections();
    return [...streakRewards]
      .filter((r) => r.active)
      .sort((a, b) => a.day - b.day);
  }

  public getRewardForDay(day: number): IStreakReward | undefined {
    return this.getActiveRewards().find((r) => r.day === day);
  }

  public getUltimateReward(): IStreakReward {
    const rewards = this.getActiveRewards();
    return rewards.find((r) => r.isUltimate) || rewards[rewards.length - 1];
  }
}

export const rewardService = new RewardService();
