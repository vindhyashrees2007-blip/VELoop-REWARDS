import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Coins,
  Crown,
  Flame,
  Gift,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import styles from '../../pages/DailyStreak/DailyStreak.module.css';
import { LeaderboardEntry, LeaderboardResponse, streakApi } from '../../services/streakApi.ts';

interface StreakLeaderboardProps {
  /**
   * Optional reactive key (e.g., currentStreak or wallet balance) so that whenever
   * the user claims a daily reward or simulates time, the leaderboard re-fetches automatically.
   */
  refreshTrigger?: string | number;
}

export function StreakLeaderboard({ refreshTrigger }: StreakLeaderboardProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboardData = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await streakApi.getLeaderboard(10);
      if (response && response.success) {
        setData(response);
      } else {
        setError('Unable to load aggregated streak leaderboard.');
      }
    } catch {
      setError('Network error while fetching leaderboard rankings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaderboardData(Boolean(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLeaderboardData, refreshTrigger]);

  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return {
        bg: 'linear-gradient(135deg, #fde047 0%, #f59e0b 55%, #b45309 100%)',
        color: '#1c1008',
        border: '1px solid #fef08a',
        shadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
      };
    }
    if (rank === 2) {
      return {
        bg: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        shadow: '0 4px 12px rgba(148, 163, 184, 0.3)',
      };
    }
    if (rank === 3) {
      return {
        bg: 'linear-gradient(135deg, #fdba74 0%, #d97706 60%, #92400e 100%)',
        color: '#1c1008',
        border: '1px solid #fed7aa',
        shadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
      };
    }
    return {
      bg: 'rgba(38, 25, 72, 0.9)',
      color: '#cbd5e1',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      shadow: 'none',
    };
  };

  const getTierBadgeStyle = (tier: string) => {
    if (tier === 'Crown Legend') {
      return {
        background: 'rgba(245, 158, 11, 0.2)',
        border: '1px solid rgba(251, 191, 36, 0.55)',
        color: '#fde047',
      };
    }
    if (tier === 'Grandmaster VIP') {
      return {
        background: 'rgba(168, 85, 247, 0.22)',
        border: '1px solid rgba(192, 132, 252, 0.5)',
        color: '#e9d5ff',
      };
    }
    if (tier === 'Diamond Streaker') {
      return {
        background: 'rgba(14, 165, 233, 0.18)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        color: '#bae6fd',
      };
    }
    if (tier === 'Gold Streaker') {
      return {
        background: 'rgba(234, 179, 8, 0.16)',
        border: '1px solid rgba(250, 204, 21, 0.4)',
        color: '#fef08a',
      };
    }
    return {
      background: 'rgba(16, 185, 129, 0.15)',
      border: '1px solid rgba(52, 211, 153, 0.38)',
      color: '#a7f3d0',
    };
  };

  if (loading && !data) {
    return (
      <section className={styles.leaderboardSection} aria-label="Streak Leaderboard Loading">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className={`${styles.skeletonPulse} rounded-3`} style={{ width: 260, height: 32 }} />
          <div className={`${styles.skeletonPulse} rounded-pill`} style={{ width: 120, height: 32 }} />
        </div>
        <div className={styles.podiumGrid}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={`${styles.skeletonPulse} rounded-4`} style={{ height: 148 }} />
          ))}
        </div>
        <div className="d-flex flex-column gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={`${styles.skeletonPulse} rounded-3`} style={{ height: 54 }} />
          ))}
        </div>
      </section>
    );
  }

  const topUsers: LeaderboardEntry[] = data?.leaderboard || [];
  const podiumTopThree = topUsers.slice(0, 3);
  const maxStreak = Math.max(data?.summary?.highestStreakDays || 42, 1);
  const currentStanding = data?.currentUserStanding;

  return (
    <section className={styles.leaderboardSection} id="streak-leaderboard" aria-label="Top 10 Streak Leaderboard">
      {/* Header Row */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(124, 58, 237, 0.3) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(245, 158, 11, 0.18)',
              flexShrink: 0,
            }}
          >
            <Trophy size={24} className="text-warning" />
          </div>
          <div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h2 className="h4 fw-bold text-white m-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Top 10 Streak Leaderboard
              </h2>
              <span
                className="badge rounded-pill font-mono-num"
                style={{
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                  color: '#34d399',
                  fontSize: '0.7rem',
                }}
              >
                LIVE AGGREGATED RANKS
              </span>
            </div>
            <p className="text-secondary small m-0">
              Ranked by longest consecutive daily check-in streak and cumulative VELoop rewards earned.
            </p>
          </div>
        </div>

        {/* Summary KPI Strip + Refresh Button */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {data?.summary && (
            <>
              <div
                className="px-3 py-1 rounded-pill d-none d-md-inline-flex align-items-center gap-2 small"
                style={{
                  background: 'rgba(17, 10, 36, 0.85)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Users size={14} className="text-info" />
                <span className="text-secondary">Streakers:</span>
                <strong className="text-white font-mono-num">{data.summary.totalParticipants}</strong>
              </div>

              <div
                className="px-3 py-1 rounded-pill d-none d- sm-inline-flex align-items-center gap-2 small"
                style={{
                  background: 'rgba(17, 10, 36, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                <Flame size={14} className="text-warning" fill="#f59e0b" />
                <span className="text-secondary">Record:</span>
                <strong className="text-warning font-mono-num">{data.summary.highestStreakDays} Days</strong>
              </div>
            </>
          )}

          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchLeaderboardData(true)}
            className="btn btn-sm d-inline-flex align-items-center gap-1 text-light"
            style={{
              background: 'rgba(42, 27, 78, 0.9)',
              border: '1px solid rgba(167, 139, 250, 0.4)',
              borderRadius: 999,
              fontSize: '0.76rem',
              padding: '0.35rem 0.85rem',
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-warning' : 'text-warning'} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Ranks'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="alert d-flex align-items-center justify-content-between py-2 px-3 rounded-4 mb-3"
          style={{
            background: 'rgba(239, 68, 68, 0.16)',
            border: '1px solid rgba(248, 113, 113, 0.45)',
            color: '#fecaca',
          }}
        >
          <span className="small">{error}</span>
          <button
            type="button"
            onClick={() => fetchLeaderboardData(false)}
            className="btn btn-sm btn-outline-light py-0 px-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 3 Champions Podium Showcase */}
      {podiumTopThree.length > 0 && (
        <div className={styles.podiumGrid}>
          {podiumTopThree.map((champ) => {
            const isFirst = champ.rank === 1;
            const isSecond = champ.rank === 2;
            const cardClass = isFirst
              ? `${styles.podiumCard} ${styles.podiumCardFirst}`
              : isSecond
                ? `${styles.podiumCard} ${styles.podiumCardSecond}`
                : `${styles.podiumCard} ${styles.podiumCardThird}`;

            const rankStyle = getRankStyle(champ.rank);
            const tierStyle = getTierBadgeStyle(champ.tierBadge);

            return (
              <div key={champ.userId} className={cardClass}>
                <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="font-mono-num fw-bold d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: rankStyle.bg,
                        color: rankStyle.color,
                        border: rankStyle.border,
                        boxShadow: rankStyle.shadow,
                        fontSize: '0.88rem',
                      }}
                    >
                      #{champ.rank}
                    </span>
                    <div>
                      <div className="d-flex align-items-center gap-1">
                        <span className="fw-bold text-white" style={{ fontSize: '0.96rem' }}>
                          {champ.name}
                        </span>
                        {champ.isCurrentUser && (
                          <span className="badge bg-warning text-dark" style={{ fontSize: '0.62rem' }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-secondary font-mono-num" style={{ fontSize: '0.72rem' }}>
                        {champ.maskedEmail}
                      </div>
                    </div>
                  </div>

                  {isFirst ? (
                    <Crown size={22} className="text-warning flex-shrink-0" fill="#fbbf24" />
                  ) : isSecond ? (
                    <Medal size={20} className="text-light flex-shrink-0" />
                  ) : (
                    <Award size={20} className="text-warning flex-shrink-0" />
                  )}
                </div>

                <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                  <span
                    className="px-2 py-1 rounded-pill fw-semibold"
                    style={{
                      ...tierStyle,
                      fontSize: '0.68rem',
                    }}
                  >
                    {champ.tierBadge}
                  </span>

                  <span className="text-secondary small font-mono-num" style={{ fontSize: '0.73rem' }}>
                    {champ.cyclesCompleted}x 7-Day Cycles
                  </span>
                </div>

                <div
                  className="p-2 rounded-3 d-flex align-items-center justify-content-between"
                  style={{
                    background: 'rgba(11, 6, 24, 0.68)',
                    border: '1px solid rgba(139, 92, 246, 0.22)',
                  }}
                >
                  <div className="d-flex align-items-center gap-1">
                    <Flame size={18} className="text-warning" fill="#f59e0b" />
                    <span
                      className="font-mono-num fw-bold text-white"
                      style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.15rem' }}
                    >
                      {champ.longestStreak} Days
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2 font-mono-num small">
                    <span className="text-info fw-bold d-inline-flex align-items-center gap-1">
                      <Coins size={13} />
                      {champ.veBalance} VEs
                    </span>
                    {champ.giftCardBalanceInr > 0 && (
                      <span className="text-warning fw-bold d-inline-flex align-items-center gap-1">
                        <Gift size={13} />₹{champ.giftCardBalanceInr}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top 10 Ranked Leaderboard List */}
      <div className="d-flex flex-column gap-2">
        {/* Desktop Table Column Headers */}
        <div
          className="d-none d-md-grid px-3 py-1 text-secondary fw-semibold"
          style={{
            gridTemplateColumns: '64px 1.6fr 1fr 1fr 1.1fr',
            gap: '0.75rem',
            fontSize: '0.73rem',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          <div>Rank</div>
          <div>Streaker & Tier</div>
          <div>Longest Streak</div>
          <div className="d-none d-xl-block">Cycle Progress</div>
          <div className="text-end">Total Rewards</div>
        </div>

        {topUsers.map((entry) => {
          const rankStyle = getRankStyle(entry.rank);
          const tierStyle = getTierBadgeStyle(entry.tierBadge);
          const streakPercent = Math.min(100, Math.max(10, Math.round((entry.longestStreak / maxStreak) * 100)));
          const rowClass = entry.isCurrentUser
            ? `${styles.leaderboardRow} ${styles.leaderboardRowCurrentUser}`
            : styles.leaderboardRow;

          return (
            <div key={entry.userId} className={rowClass}>
              {/* Column 1: Rank Badge */}
              <div className="d-flex align-items-center gap-2">
                <span
                  className="font-mono-num fw-bold d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: rankStyle.bg,
                    color: rankStyle.color,
                    border: rankStyle.border,
                    boxShadow: rankStyle.shadow,
                    fontSize: '0.84rem',
                  }}
                >
                  #{entry.rank}
                </span>
              </div>

              {/* Column 2: User Identity & Tier Badge */}
              <div className="d-flex align-items-center gap-2 min-w-0">
                <div
                  className="d-none d-sm-inline-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background:
                      entry.rank <= 3
                        ? 'linear-gradient(135deg, #7c3aed 0%, #f59e0b 100%)'
                        : 'rgba(124, 58, 237, 0.28)',
                    border: '1px solid rgba(167, 139, 250, 0.4)',
                    fontSize: '0.78rem',
                  }}
                >
                  {entry.initials}
                </div>
                <div className="text-truncate">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.9rem' }}>
                      {entry.name}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="badge bg-warning text-dark" style={{ fontSize: '0.62rem' }}>
                        YOU
                      </span>
                    )}
                    <span
                      className="px-2 py-0 rounded-pill d-none d-lg-inline-block"
                      style={{
                        ...tierStyle,
                        fontSize: '0.66rem',
                        fontWeight: 600,
                      }}
                    >
                      {entry.tierBadge}
                    </span>
                  </div>
                  <div className="text-secondary font-mono-num" style={{ fontSize: '0.72rem' }}>
                    {entry.maskedEmail}
                  </div>
                </div>
              </div>

              {/* Column 3: Longest Streak Flame Counter + Visual Progress Bar */}
              <div>
                <div className="d-flex align-items-center gap-1 mb-1">
                  <Flame size={15} className="text-warning flex-shrink-0" fill="#f59e0b" />
                  <span className="font-mono-num fw-bold text-white" style={{ fontSize: '0.92rem' }}>
                    {entry.longestStreak} Days
                  </span>
                </div>
                <div
                  className="d-none d-sm-block rounded-pill overflow-hidden"
                  style={{
                    height: 5,
                    background: 'rgba(255, 255, 255, 0.08)',
                    width: '100%',
                    maxWidth: 140,
                  }}
                >
                  <div
                    style={{
                      width: `${streakPercent}%`,
                      height: '100%',
                      borderRadius: 999,
                      background:
                        entry.rank <= 3
                          ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                          : 'linear-gradient(90deg, #a855f7 0%, #38bdf8 100%)',
                    }}
                  />
                </div>
              </div>

              {/* Column 4: 7-Day Cycle Progress (Desktop XL) */}
              <div className="d-none d-xl-flex flex-column">
                <div className="small text-light font-mono-num fw-semibold" style={{ fontSize: '0.8rem' }}>
                  {entry.cyclesCompleted} Cycles Completed
                </div>
                <div className="text-secondary small font-mono-num" style={{ fontSize: '0.71rem' }}>
                  Current: Day {entry.currentDay}/7 ({entry.cycleStatus})
                </div>
              </div>

              {/* Column 5: Cumulative Wallet Rewards */}
              <div className="text-end font-mono-num d-none d-md-block">
                <div className="fw-bold text-white" style={{ fontSize: '0.88rem' }}>
                  {entry.veBalance.toLocaleString()} <span className="text-info small">VEs</span>
                </div>
                <div className="text-warning small fw-semibold" style={{ fontSize: '0.74rem' }}>
                  {entry.giftCardBalanceInr > 0 ? `+ ₹${entry.giftCardBalanceInr} Amazon Voucher` : 'Active Streaker'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Authenticated User Global Standing Banner */}
      {currentStanding?.entry && (
        <div className={styles.userStandingFooter}>
          <div className="d-flex align-items-center gap-3">
            <div
              className="font-mono-num fw-bold d-inline-flex align-items-center justify-content-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(251, 191, 36, 0.55)',
                color: '#fde047',
                fontSize: '0.9rem',
              }}
            >
              #{currentStanding.entry.rank}
            </div>
            <div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="fw-bold text-white" style={{ fontSize: '0.92rem' }}>
                  Your Global Rank: #{currentStanding.entry.rank} ({currentStanding.entry.name})
                </span>
                <span
                  className="badge rounded-pill"
                  style={{
                    background: 'rgba(139, 92, 246, 0.28)',
                    border: '1px solid rgba(167, 139, 250, 0.45)',
                    color: '#ddd6fe',
                    fontSize: '0.68rem',
                  }}
                >
                  {currentStanding.entry.tierBadge}
                </span>
              </div>
              <div className="text-secondary small">
                {currentStanding.inTopTen ? (
                  <span className="text-success fw-semibold">
                    <Sparkles size={13} className="me-1" />
                    You are currently ranked inside the Top 10 Streak Champions!
                  </span>
                ) : (
                  <span>
                    Check in for <strong className="text-warning">{currentStanding.daysToReachTopTen} more consecutive days</strong> to overtake #10 and enter the Top 10 Leaderboard!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 font-mono-num">
            <div className="text-end">
              <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                YOUR STREAK
              </div>
              <div className="fw-bold text-warning d-flex align-items-center gap-1">
                <Flame size={15} fill="#f59e0b" />
                <span>{currentStanding.entry.longestStreak} Days</span>
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 28,
                background: 'rgba(148, 163, 184, 0.25)',
              }}
            />
            <div className="text-end">
              <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                YOUR WALLET
              </div>
              <div className="fw-bold text-white">
                {currentStanding.entry.veBalance} VEs
                {currentStanding.entry.giftCardBalanceInr > 0 && (
                  <span className="text-warning ms-1">+ ₹{currentStanding.entry.giftCardBalanceInr}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backend Aggregation Info Footer */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top border-secondary border-opacity-25 text-secondary" style={{ fontSize: '0.72rem' }}>
        <div className="d-flex align-items-center gap-1">
          <ShieldCheck size={13} className="text-success" />
          <span>
            Endpoint: <code>GET /api/daily-streak/leaderboard?limit=10</code> (Server-side aggregated from{' '}
            <code>streakCycles</code>, <code>users</code> &amp; <code>wallets</code>)
          </span>
        </div>
        <div className="d-flex align-items-center gap-1 font-mono-num">
          <TrendingUp size={13} className="text-warning" />
          <span>
            Last synced: {data?.serverTime ? new Date(data.serverTime).toLocaleTimeString() : 'Live'}
          </span>
        </div>
      </div>
    </section>
  );
}
