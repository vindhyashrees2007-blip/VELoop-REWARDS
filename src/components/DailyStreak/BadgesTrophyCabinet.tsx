import React from 'react';
import { 
  Trophy, 
  Award, 
  Medal, 
  Sparkles, 
  Star, 
  Crown, 
  MapPin, 
  Target, 
  Flame, 
  CheckCircle2, 
  Lock, 
  X,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { StreakDataResponse } from '../../services/streakApi.ts';

interface BadgesTrophyCabinetProps {
  streakData: StreakDataResponse | null;
  rewardsHistoryClaims: Array<any>;
  onClose: () => void;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  category: 'Streak' | 'Exploration' | 'Productivity' | 'Wealth' | 'Milestone';
  isUnlocked: boolean;
  progressText: string;
  unlockedAt?: string;
  gradient: string;
}

export function BadgesTrophyCabinet({
  streakData,
  rewardsHistoryClaims,
  onClose,
}: BadgesTrophyCabinetProps) {
  const currentStreak = streakData?.streak?.currentStreak || 0;
  const currentDay = streakData?.streak?.currentDay || 1;
  const veBalance = streakData?.wallet?.veBalance || 0;
  const totalClaims = rewardsHistoryClaims.length;

  const hasLocationClaim = rewardsHistoryClaims.some(c => c.location && c.location.latitude);
  const hasProductivityGoal = rewardsHistoryClaims.some(c => c.productivityGoal && c.productivityGoal.trim().length > 0);
  const completedCycle = currentStreak >= 7 || currentDay > 7 || totalClaims >= 7;

  const badges: BadgeDefinition[] = [
    {
      id: 'first_step',
      title: '🌱 First Step',
      subtitle: 'Initiate Your Journey',
      description: 'Successfully claim your very first daily streak reward in VELoop.',
      iconName: 'Sparkles',
      category: 'Milestone',
      isUnlocked: totalClaims > 0 || currentStreak >= 1,
      progressText: totalClaims > 0 ? 'Unlocked!' : '0 / 1 claim',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'early_bird',
      title: '⚡ Early Bird',
      subtitle: 'Morning Momentum',
      description: 'Claim 3 consecutive daily rewards without missing a beat.',
      iconName: 'Zap',
      category: 'Streak',
      isUnlocked: totalClaims >= 3 || currentStreak >= 3,
      progressText: `${Math.min(totalClaims, 3)} / 3 claims`,
      gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/30 text-amber-400',
    },
    {
      id: 'streak_master_7',
      title: '🔥 7-Day Streak Master',
      subtitle: 'Week 1 Champion',
      description: 'Complete a full 7-day streak cycle and claim the Ultimate Crown.',
      iconName: 'Trophy',
      category: 'Streak',
      isUnlocked: completedCycle,
      progressText: completedCycle ? 'Completed!' : `${Math.min(currentStreak, 7)} / 7 days`,
      gradient: 'from-orange-500/25 via-red-500/10 to-transparent border-orange-500/40 text-orange-400',
    },
    {
      id: 'consistency_king',
      title: '👑 Consistency King',
      subtitle: 'Unstoppable Dedication',
      description: 'Accumulate 5 or more total daily streak claims.',
      iconName: 'Crown',
      category: 'Milestone',
      isUnlocked: totalClaims >= 5,
      progressText: `${Math.min(totalClaims, 5)} / 5 claims`,
      gradient: 'from-purple-500/25 via-indigo-500/10 to-transparent border-purple-500/40 text-purple-300',
    },
    {
      id: 'road_warrior',
      title: '📍 Road Warrior',
      subtitle: 'Geo-Validated Claimer',
      description: 'Attach your live browser geolocation data to a streak claim.',
      iconName: 'MapPin',
      category: 'Exploration',
      isUnlocked: hasLocationClaim,
      progressText: hasLocationClaim ? 'GPS Verified!' : 'Pending GPS check',
      gradient: 'from-sky-500/20 via-blue-500/10 to-transparent border-sky-500/30 text-sky-400',
    },
    {
      id: 'productivity_champ',
      title: '🎯 Productivity Champion',
      subtitle: 'Goal Driven Success',
      description: 'Set and attach a daily productivity goal during your streak claim.',
      iconName: 'Target',
      category: 'Productivity',
      isUnlocked: hasProductivityGoal,
      progressText: hasProductivityGoal ? 'Goal Recorded!' : 'Set a goal to unlock',
      gradient: 'from-pink-500/20 via-rose-500/10 to-transparent border-pink-500/30 text-pink-400',
    },
    {
      id: 'diamond_collector',
      title: '💎 Diamond Collector',
      subtitle: 'Wealth Accumulator',
      description: 'Accumulate a wallet balance of 100 VES tokens or more.',
      iconName: 'Medal',
      category: 'Wealth',
      isUnlocked: veBalance >= 100,
      progressText: `${veBalance} / 100 VES`,
      gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'elite_scholar',
      title: '⭐ Elite AI Scholar',
      subtitle: 'Studio Connoisseur',
      description: 'Explore the AI Meme & Prompt Studio and generate custom AI assets.',
      iconName: 'Star',
      category: 'Milestone',
      isUnlocked: totalClaims >= 2, // Automatically unlocked for active users
      progressText: 'Active Studio User',
      gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent border-yellow-500/30 text-yellow-300',
    },
  ];

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalBadges = badges.length;
  const completionPercentage = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                Digital Trophies & Badges Cabinet
              </h2>
              <p className="text-sm text-slate-400">
                Unlock prestigious achievements as you build your daily streak and achieve productivity goals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Overview Banner */}
        <div className="my-6 p-5 bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-slate-900 border border-slate-700/60 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-500/40 text-amber-300 font-bold text-lg shadow-inner">
              {completionPercentage}%
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {unlockedCount} of {totalBadges} Trophies Unlocked
              </h3>
              <p className="text-xs text-slate-400">
                {unlockedCount === totalBadges 
                  ? '🎉 Incredible! You have unlocked all digital trophies!' 
                  : 'Keep claiming your daily streak & setting goals to collect them all!'}
              </p>
            </div>
          </div>
          <div className="w-full md:w-56 bg-slate-900/80 rounded-full h-3 p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => {
            const isUnlocked = badge.isUnlocked;
            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 bg-gradient-to-br ${
                  isUnlocked
                    ? badge.gradient + ' shadow-lg shadow-black/20 hover:scale-[1.01]'
                    : 'from-slate-800/40 to-slate-900/60 border-slate-800 text-slate-500 opacity-60 grayscale'
                }`}
              >
                <div className={`p-3 rounded-xl border ${
                  isUnlocked 
                    ? 'bg-slate-900/90 border-amber-500/40 text-amber-400 shadow-md' 
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  {isUnlocked ? (
                    badge.iconName === 'Trophy' ? <Trophy className="w-7 h-7" /> :
                    badge.iconName === 'Crown' ? <Crown className="w-7 h-7" /> :
                    badge.iconName === 'Zap' ? <Zap className="w-7 h-7" /> :
                    badge.iconName === 'MapPin' ? <MapPin className="w-7 h-7" /> :
                    badge.iconName === 'Target' ? <Target className="w-7 h-7" /> :
                    badge.iconName === 'Medal' ? <Medal className="w-7 h-7" /> :
                    <Sparkles className="w-7 h-7" />
                  ) : (
                    <Lock className="w-7 h-7" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`font-bold text-base truncate ${isUnlocked ? 'text-slate-100' : 'text-slate-400'}`}>
                      {badge.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                      isUnlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}>
                      {badge.category}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-300 mt-0.5">{badge.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
                  
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`font-semibold flex items-center gap-1 ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {badge.progressText}
                    </span>
                    {isUnlocked && (
                      <span className="text-[10px] text-amber-400/80 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                        🏆 UNLOCKED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Badges update automatically upon daily streak claims and milestone achievements.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition shadow"
          >
            Close Cabinet
          </button>
        </div>

      </div>
    </div>
  );
}
