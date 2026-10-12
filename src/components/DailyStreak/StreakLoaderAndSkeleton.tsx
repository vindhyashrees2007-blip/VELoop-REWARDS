import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';
import styles from '../../pages/DailyStreak/DailyStreak.module.css';

/**
 * Section 69: Branded VELoop Loader
 */
export function StreakLoader() {
  return (
    <div
      className={styles.pageWrapper}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '85vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        className={styles.animateCrownGlow}
        style={{
          width: 84,
          height: 84,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #4c1d95 0%, #1e1038 100%)',
          border: '2px solid #fbbf24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 0 36px rgba(245, 158, 11, 0.32)',
        }}
      >
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: '1.85rem',
            background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          VR
        </span>
      </div>
      <div className="d-flex align-items-center gap-2 mb-2">
        <Flame size={20} className="text-warning" />
        <h2 className="h4 fw-bold m-0 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          VELoop Rewards
        </h2>
      </div>
      <p className="text-secondary mb-3" style={{ fontSize: '0.95rem' }}>
        Loading your streak & verifying server timestamps...
      </p>
      <div
        style={{
          width: 180,
          height: 5,
          borderRadius: 999,
          background: 'rgba(139, 92, 246, 0.22)',
          overflow: 'hidden',
        }}
      >
        <div
          className={styles.skeletonPulse}
          style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #7c3aed, #fbbf24, #7c3aed)' }}
        />
      </div>
    </div>
  );
}

/**
 * Sections 70 & 71: Theme-matched Dark VELoop Skeleton Loading State
 */
export function StreakSkeleton() {
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.containerMain}>
        {/* Header Skeleton */}
        <div className={styles.streakHeader}>
          <div className="d-flex align-items-center gap-3">
            <div className={styles.skeletonPulse} style={{ width: 42, height: 42, borderRadius: 12 }} />
            <div>
              <div className={styles.skeletonPulse} style={{ width: 160, height: 22, borderRadius: 8, marginBottom: 6 }} />
              <div className={styles.skeletonPulse} style={{ width: 260, height: 14, borderRadius: 6 }} />
            </div>
          </div>
          <div className={styles.skeletonPulse} style={{ width: 145, height: 40, borderRadius: 999 }} />
        </div>

        {/* Hero Banner + Ultimate Reward Skeleton */}
        <div className={styles.heroGrid}>
          <div className={styles.skeletonPulse} style={{ height: 220, borderRadius: 22 }} />
          <div className={styles.skeletonPulse} style={{ height: 220, borderRadius: 22 }} />
        </div>

        {/* 7 Daily Reward Cards Skeleton */}
        <div className={styles.rewardCardsGrid}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className={styles.skeletonPulse} style={{ height: 215, borderRadius: 18 }} />
          ))}
        </div>

        {/* Benefits Info Section Skeleton */}
        <div className={styles.benefitsGrid}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={styles.skeletonPulse} style={{ height: 78, borderRadius: 16 }} />
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className={styles.skeletonPulse} style={{ height: 52, borderRadius: 16 }}>
          <div className="d-flex align-items-center justify-content-center h-100 gap-2 text-secondary small">
            <ShieldCheck size={16} /> Syncing with VELoop Reward Ledger...
          </div>
        </div>
      </div>
    </div>
  );
}
