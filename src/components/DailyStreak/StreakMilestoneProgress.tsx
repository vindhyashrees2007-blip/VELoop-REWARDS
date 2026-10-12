import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Copy,
  Crown,
  FastForward,
  Flame,
  Gift,
  Lock,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import styles from '../../pages/DailyStreak/DailyStreak.module.css';
import { GiftBoxArtwork, GoldenCrownArtwork } from './RewardArtwork.tsx';

export interface MilestoneItem {
  days: number;
  title: string;
  tierBadge: string;
  isMajor: boolean;
  rewardValue: string;
  voucherInr?: number;
  bonusVes: number;
  artworkType: 'GIFT_BOX' | 'TROPHY' | 'DIAMOND' | 'SHIELD' | 'CROWN';
  summary: string;
  perks: string[];
  mockCode: string;
}

const MILESTONES: MilestoneItem[] = [
  {
    days: 7,
    title: '1-Week Champion',
    tierBadge: 'Silver Streaker',
    isMajor: true,
    rewardValue: '₹50 Amazon Voucher + 25 VEs',
    voucherInr: 50,
    bonusVes: 25,
    artworkType: 'GIFT_BOX',
    summary: 'First complete 7-day streak cycle. Unlocks your first verified Amazon Shopping Voucher and VIP streak badge.',
    perks: [
      'Instant ₹50 Amazon Gift Card digital code',
      '25 Bonus VEs automatically credited to wallet',
      'Silver Streaker profile badge and leaderboard recognition',
      'VIP reward multiplier unlocked for next cycle',
    ],
    mockCode: 'AMZN-7DAY-VR50-CLAIMED',
  },
  {
    days: 14,
    title: 'Fortnight Streaker',
    tierBadge: 'Gold Streaker',
    isMajor: false,
    rewardValue: '150 Bonus VEs + Gold Rank',
    bonusVes: 150,
    artworkType: 'TROPHY',
    summary: 'Two consecutive weeks of uninterrupted daily check-ins. Elevates your rank to Gold Streaker.',
    perks: [
      '150 Bonus VEs credited straight to your ledger',
      'Gold Streaker prestige banner on leaderboard',
      '1.2x multiplier on weekend daily reward claims',
      'Exclusive early access to high-reward CPA offers',
    ],
    mockCode: 'GOLD-14D-VE150-BONUS',
  },
  {
    days: 30,
    title: 'Monthly Master (30 Days)',
    tierBadge: 'Diamond Streaker',
    isMajor: true,
    rewardValue: '₹250 Amazon Voucher + 500 VEs',
    voucherInr: 250,
    bonusVes: 500,
    artworkType: 'DIAMOND',
    summary: 'A full month of daily discipline! Major milestone granting ₹250 Amazon shopping voucher and 500 VEs.',
    perks: [
      '₹250 Amazon Shopping Card voucher code',
      '500 Bonus VEs deposited into your wallet',
      'Diamond Streaker verified status on Top 10 leaderboard',
      'Zero cooldown grace pass on future accidental timer lapses',
    ],
    mockCode: 'AMZN-30D-VR250-MASTER',
  },
  {
    days: 60,
    title: 'Endurance Titan (60 Days)',
    tierBadge: 'Grandmaster VIP',
    isMajor: false,
    rewardValue: '₹500 Amazon Voucher + 1,200 VEs',
    voucherInr: 500,
    bonusVes: 1200,
    artworkType: 'SHIELD',
    summary: 'Two full months without missing a day. Unlocks the prestigious Grandmaster VIP tier.',
    perks: [
      '₹500 Amazon Shopping Voucher code',
      '1,200 Bonus VEs instant wallet credit',
      'Grandmaster VIP badge with custom avatar ring',
      'Priority express CPA task verification & instant payouts',
    ],
    mockCode: 'AMZN-60D-VR500-TITAN',
  },
  {
    days: 100,
    title: 'Century Legend (100 Days)',
    tierBadge: 'Crown Legend',
    isMajor: true,
    rewardValue: '₹1,000 Amazon Voucher + 2,500 VEs',
    voucherInr: 1000,
    bonusVes: 2500,
    artworkType: 'CROWN',
    summary: 'The ultimate 100-day milestone! Unlocks ₹1,000 Amazon voucher, 2,500 VEs, and the Crown Legend insignia.',
    perks: [
      '₹1,000 Amazon Grand Shopping Spree Voucher',
      '2,500 Bonus VEs added directly to your permanent balance',
      'Legendary Crown Icon displayed next to your name globally',
      'Lifetime VIP status with perpetual double reward bonuses',
    ],
    mockCode: 'AMZN-100D-CROWN1000-LEGEND',
  },
];

interface StreakMilestoneProgressProps {
  currentStreak: number;
  walletBalance: number;
  giftCardBalanceInr: number;
  onSimulateMilestone?: (days: number) => void;
  onResetPreset?: () => void;
}

/**
 * Web Audio API synthesizer for celebratory chime (C5 - E5 - G5 - C6 polyphonic fanfare)
 */
function playCelebrationFanfare() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.9);
    });
  } catch {
    // Ignore audio permission or policy restrictions
  }
}

export function StreakMilestoneProgress({
  currentStreak,
  walletBalance,
  giftCardBalanceInr,
  onSimulateMilestone,
  onResetPreset,
}: StreakMilestoneProgressProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Determine next milestone
  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.days > currentStreak) || MILESTONES[MILESTONES.length - 1];
  }, [currentStreak]);

  const daysToNext = Math.max(0, nextMilestone.days - currentStreak);

  // Compute visual progress percentage (0 to 100%)
  // We use a segmented non-linear mapping so 7, 14, 30, 60, 100 days are visually evenly proportioned
  const progressPercent = useMemo(() => {
    if (currentStreak <= 0) return 0;
    if (currentStreak >= 100) return 100;
    if (currentStreak <= 7) {
      return (currentStreak / 7) * 20;
    }
    if (currentStreak <= 14) {
      return 20 + ((currentStreak - 7) / 7) * 20;
    }
    if (currentStreak <= 30) {
      return 40 + ((currentStreak - 14) / 16) * 20;
    }
    if (currentStreak <= 60) {
      return 60 + ((currentStreak - 30) / 30) * 20;
    }
    return 80 + ((currentStreak - 60) / 40) * 20;
  }, [currentStreak]);

  // Particle Confetti Animation System
  const triggerConfettiAnimation = useCallback(() => {
    if (soundEnabled) {
      playCelebrationFanfare();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const colors = ['#f59e0b', '#fbbf24', '#a855f7', '#38bdf8', '#34d399', '#ffffff', '#ec4899'];
    const particlesCount = 75;
    const particles = Array.from({ length: particlesCount }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.35 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
      gravity: 0.32,
    }));

    let startTime = performance.now();
    const render = (time: number) => {
      const elapsed = time - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeCount = 0;
      particles.forEach((p) => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.vRot;
        if (elapsed > 1200) {
          p.opacity = Math.max(0, p.opacity - 0.022);
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          activeCount++;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          ctx.restore();
        }
      });

      if (activeCount > 0 && elapsed < 3500) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(render);
  }, [soundEnabled]);

  const handleOpenMilestoneModal = (milestone: MilestoneItem) => {
    setSelectedMilestone(milestone);
    setCopiedCode(false);
    setTimeout(() => {
      triggerConfettiAnimation();
    }, 120);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setShowToast(`Reward Code "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(false);
      setShowToast(null);
    }, 3000);
  };

  const handleShareAchievement = (milestone: MilestoneItem) => {
    const text = `🔥 I reached Day ${milestone.days} on VELoop Rewards Daily Streak! Unlocked ${milestone.rewardValue} & ${milestone.tierBadge} status!`;
    navigator.clipboard.writeText(text);
    setShowToast('Achievement text copied to clipboard!');
    setTimeout(() => setShowToast(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <section
      className={styles.milestoneSection}
      id="streak-milestones"
      aria-label="Streak Milestones and Reward Animations"
    >
      {/* Toast Notification */}
      {showToast && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-3 px-3 py-2 rounded-pill shadow-lg z-3"
          style={{
            background: 'rgba(16, 185, 129, 0.95)',
            border: '1px solid #34d399',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 600,
            zIndex: 1100,
          }}
        >
          <CheckCircle2 size={16} className="d-inline me-1" />
          {showToast}
        </div>
      )}

      {/* Header Row */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
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
                Major Streak Milestones
              </h2>
              <span
                className="badge rounded-pill font-mono-num"
                style={{
                  background: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid rgba(251, 191, 36, 0.45)',
                  color: '#fde047',
                  fontSize: '0.7rem',
                }}
              >
                7 · 30 · 100 DAYS
              </span>
            </div>
            <p className="text-secondary small m-0">
              Maintain your daily check-in momentum to unlock verified Amazon Gift Vouchers, bonus VEs, and tier trophies.
            </p>
          </div>
        </div>

        {/* Current Active Streak Badge + Next Milestone Summary */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div
            className="px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
            style={{
              background: 'rgba(22, 13, 44, 0.9)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
            }}
          >
            <Flame size={16} className="text-warning" fill="#f59e0b" />
            <span className="text-secondary small">Current Streak:</span>
            <strong className="text-warning font-mono-num">{currentStreak} Days</strong>
          </div>

          {currentStreak < 100 ? (
            <div
              className="px-3 py-1 rounded-pill d-none d-md-inline-flex align-items-center gap-2"
              style={{
                background: 'rgba(22, 13, 44, 0.9)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
              }}
            >
              <Zap size={14} className="text-info" />
              <span className="text-secondary small">Next Target:</span>
              <strong className="text-white font-mono-num">
                {daysToNext === 0 ? 'Today!' : `${daysToNext} days to Day ${nextMilestone.days}`}
              </strong>
            </div>
          ) : (
            <div
              className="px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.5)',
                color: '#34d399',
              }}
            >
              <Crown size={14} />
              <strong className="small font-mono-num">Century Legend Achieved!</strong>
            </div>
          )}
        </div>
      </div>

      {/* Evaluator / Simulation Quick Test Strip */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 rounded-3 mb-3"
        style={{
          background: 'rgba(18, 10, 36, 0.72)',
          border: '1px dashed rgba(139, 92, 246, 0.35)',
        }}
      >
        <div className="d-flex align-items-center gap-1 text-secondary small">
          <FastForward size={14} className="text-warning" />
          <span className="fw-semibold text-light">Tester Fast-Track:</span>
          <span className="d-none d-sm-inline">Simulate reaching major milestones to experience reward animations:</span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-1">
          <button
            type="button"
            onClick={() => onSimulateMilestone && onSimulateMilestone(7)}
            className="btn btn-sm py-0 px-2 text-warning"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(245, 158, 11, 0.16)',
              border: '1px solid rgba(251, 191, 36, 0.45)',
              borderRadius: 6,
            }}
          >
            Test Day 7 (₹50 Voucher)
          </button>
          <button
            type="button"
            onClick={() => onSimulateMilestone && onSimulateMilestone(30)}
            className="btn btn-sm py-0 px-2 text-info"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(14, 165, 233, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: 6,
            }}
          >
            Test Day 30 (₹250 Voucher)
          </button>
          <button
            type="button"
            onClick={() => onSimulateMilestone && onSimulateMilestone(100)}
            className="btn btn-sm py-0 px-2 text-success"
            style={{
              fontSize: '0.72rem',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              borderRadius: 6,
            }}
          >
            Test Day 100 (₹1,000 + Crown)
          </button>
          {onResetPreset && (
            <button
              type="button"
              onClick={onResetPreset}
              className="btn btn-sm py-0 px-2 text-light"
              style={{
                fontSize: '0.72rem',
                background: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(167, 139, 250, 0.35)',
                borderRadius: 6,
              }}
              title="Reset streak to initial Day 2 design reference state"
            >
              <RotateCcw size={11} className="me-1" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Visual Milestone Progress Track with Checkpoints */}
      <div className={styles.milestoneTrackWrap}>
        {/* Background Track with Animated Gradient Fill */}
        <div className={styles.milestoneTrackBg}>
          <div className={styles.milestoneProgressFill} style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}>
            <div className={styles.milestoneLeadDot} title={`Current Streak: ${currentStreak} Days`} />
          </div>
        </div>

        {/* Checkpoint Nodes positioned along the track */}
        <div className={styles.milestoneNodesRow}>
          {MILESTONES.map((m) => {
            const isAchieved = currentStreak >= m.days;
            const isTarget = !isAchieved && nextMilestone.days === m.days;

            let circleClass = `${styles.milestoneNodeCircle} ${styles.milestoneNodeCircleLocked}`;
            if (isAchieved) circleClass = `${styles.milestoneNodeCircle} ${styles.milestoneNodeCircleAchieved}`;
            else if (isTarget) circleClass = `${styles.milestoneNodeCircle} ${styles.milestoneNodeCircleTarget}`;

            return (
              <div
                key={m.days}
                className={styles.milestoneNodeItem}
                onClick={() => handleOpenMilestoneModal(m)}
                title={`Day ${m.days} Milestone: ${m.title} - Click to inspect rewards`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOpenMilestoneModal(m);
                }}
              >
                <div className={circleClass}>
                  {isAchieved ? (
                    <Check size={18} strokeWidth={3} />
                  ) : m.isMajor ? (
                    <Star size={17} fill={isTarget ? '#f59e0b' : 'none'} />
                  ) : (
                    <span className="font-mono-num">{m.days}</span>
                  )}
                </div>
                <div
                  className={styles.milestoneNodeLabel}
                  style={{
                    color: isAchieved ? '#34d399' : isTarget ? '#fbbf24' : '#94a3b8',
                  }}
                >
                  Day {m.days}
                  {m.isMajor && (
                    <span className="d-block" style={{ fontSize: '0.62rem', color: '#fde047' }}>
                      ★ Major
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 Milestone Cards Grid */}
      <div className={styles.milestoneCardsGrid}>
        {MILESTONES.map((milestone) => {
          const isAchieved = currentStreak >= milestone.days;
          const isTarget = !isAchieved && nextMilestone.days === milestone.days;
          const daysLeft = milestone.days - currentStreak;

          let cardClass = styles.milestoneCard;
          if (milestone.isMajor) cardClass += ` ${styles.milestoneCardMajor}`;
          if (isAchieved) cardClass += ` ${styles.milestoneCardAchieved}`;
          else if (isTarget) cardClass += ` ${styles.milestoneCardTarget}`;
          else cardClass += ` ${styles.milestoneCardLocked}`;

          return (
            <div key={milestone.days} className={cardClass}>
              {/* Major Milestone Floating Badge */}
              {milestone.isMajor && <div className={styles.milestoneMajorTag}>Major Milestone</div>}

              {/* Top Row: Day Pill & Status Icon */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className="font-mono-num fw-bold px-2 py-0.5 rounded-pill"
                  style={{
                    fontSize: '0.74rem',
                    background: isAchieved
                      ? 'rgba(16, 185, 129, 0.22)'
                      : isTarget
                        ? 'rgba(245, 158, 11, 0.24)'
                        : 'rgba(100, 116, 139, 0.22)',
                    color: isAchieved ? '#34d399' : isTarget ? '#fde047' : '#94a3b8',
                    border: `1px solid ${
                      isAchieved ? '#10b981' : isTarget ? 'rgba(251, 191, 36, 0.5)' : 'rgba(100, 116, 139, 0.3)'
                    }`,
                  }}
                >
                  Day {milestone.days}
                </span>

                {isAchieved ? (
                  <span className="badge bg-success rounded-pill d-inline-flex align-items-center gap-1 font-mono-num">
                    <Check size={11} strokeWidth={3} /> UNLOCKED
                  </span>
                ) : isTarget ? (
                  <span className="badge bg-warning text-dark rounded-pill font-mono-num">
                    {daysLeft}D TO GO
                  </span>
                ) : (
                  <span className="text-secondary small font-mono-num d-inline-flex align-items-center gap-1">
                    <Lock size={12} /> LOCKED
                  </span>
                )}
              </div>

              {/* Artwork Icon */}
              <div className="d-flex justify-content-center my-2">
                {milestone.artworkType === 'CROWN' ? (
                  <div className={styles.animateCrownGlow} style={{ width: 62, height: 62 }}>
                    <GoldenCrownArtwork size={62} showPedestal={false} />
                  </div>
                ) : milestone.artworkType === 'GIFT_BOX' ? (
                  <div className={styles.animateFloat} style={{ width: 56, height: 56 }}>
                    <GiftBoxArtwork size={56} />
                  </div>
                ) : milestone.artworkType === 'DIAMOND' ? (
                  <div
                    className={`${styles.animateFloat} d-flex align-items-center justify-content-center`}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)',
                    }}
                  >
                    <Star size={38} className="text-info" fill="#38bdf8" />
                  </div>
                ) : milestone.artworkType === 'TROPHY' ? (
                  <div
                    className={`${styles.animateFloat} d-flex align-items-center justify-content-center`}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: 'radial-gradient(circle, rgba(251, 191, 36, 0.28) 0%, transparent 70%)',
                    }}
                  >
                    <Trophy size={36} className="text-warning" />
                  </div>
                ) : (
                  <div
                    className={`${styles.animateFloat} d-flex align-items-center justify-content-center`}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, transparent 70%)',
                    }}
                  >
                    <Award size={36} className="text-purple" style={{ color: '#c084fc' }} />
                  </div>
                )}
              </div>

              {/* Title & Reward Highlights */}
              <div className="text-center mb-2">
                <div className="fw-bold text-white mb-1" style={{ fontSize: '0.86rem' }}>
                  {milestone.title}
                </div>
                <div
                  className="font-mono-num fw-bold"
                  style={{
                    fontSize: '0.92rem',
                    color: milestone.isMajor ? '#fbbf24' : '#38bdf8',
                  }}
                >
                  {milestone.rewardValue}
                </div>
                <div className="text-secondary small mt-1 font-mono-num" style={{ fontSize: '0.72rem' }}>
                  {milestone.tierBadge}
                </div>
              </div>

              {/* Action Button: Opens celebration & reward preview animation */}
              <div className="mt-auto">
                <button
                  type="button"
                  onClick={() => handleOpenMilestoneModal(milestone)}
                  className={`btn btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-1 ${
                    isAchieved
                      ? 'btn-outline-success text-success'
                      : isTarget
                        ? 'btn-warning text-dark fw-bold'
                        : 'btn-outline-secondary text-secondary'
                  }`}
                  style={{
                    borderRadius: 10,
                    fontSize: '0.74rem',
                    padding: '0.4rem 0.5rem',
                  }}
                >
                  {isAchieved ? (
                    <>
                      <Sparkles size={13} /> Celebrate Reward
                    </>
                  ) : isTarget ? (
                    <>
                      <span>Inspect Target</span> <ChevronRight size={13} />
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> Preview Rewards
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestone Celebration & Reward Animation Modal */}
      {selectedMilestone && (
        <div
          className={styles.celebrationModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Milestone Details: ${selectedMilestone.title}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMilestone(null);
          }}
        >
          {/* Confetti Animation Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          <div className={styles.celebrationModalCard}>
            {/* Rotating background radiance rays */}
            <div className={styles.rotatingRaysBg} />

            {/* Sound toggle & Close Button */}
            <div className="position-absolute top-0 end-0 p-3 d-flex align-items-center gap-2 z-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="btn btn-sm btn-outline-light rounded-circle p-1"
                style={{ width: 32, height: 32 }}
                title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="btn btn-sm btn-outline-light rounded-circle p-1"
                style={{ width: 32, height: 32 }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="position-relative z-2">
              {/* Header Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(251, 191, 36, 0.5)' }}>
                <Sparkles size={15} className="text-warning" />
                <span className="font-mono-num fw-bold text-warning small">
                  DAY {selectedMilestone.days} {selectedMilestone.isMajor ? '★ MAJOR MILESTONE' : 'MILESTONE'}
                </span>
                <Sparkles size={15} className="text-warning" />
              </div>

              {/* Large Center Reward Artwork */}
              <div className="d-flex justify-content-center my-3">
                {selectedMilestone.artworkType === 'CROWN' ? (
                  <div className={styles.animateCrownGlow}>
                    <GoldenCrownArtwork size={110} showPedestal={true} />
                  </div>
                ) : selectedMilestone.artworkType === 'GIFT_BOX' ? (
                  <div className={styles.animateFloat}>
                    <GiftBoxArtwork size={100} />
                  </div>
                ) : selectedMilestone.artworkType === 'DIAMOND' ? (
                  <div
                    className={`${styles.animateFloat} d-flex align-items-center justify-content-center rounded-circle`}
                    style={{
                      width: 100,
                      height: 100,
                      background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 75%)',
                      border: '2px solid rgba(56, 189, 248, 0.5)',
                    }}
                  >
                    <Star size={64} className="text-info" fill="#38bdf8" />
                  </div>
                ) : (
                  <div
                    className={`${styles.animateFloat} d-flex align-items-center justify-content-center rounded-circle`}
                    style={{
                      width: 100,
                      height: 100,
                      background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 75%)',
                      border: '2px solid rgba(251, 191, 36, 0.5)',
                    }}
                  >
                    <Trophy size={60} className="text-warning" />
                  </div>
                )}
              </div>

              {/* Title & Tier */}
              <h3 className="h4 fw-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {selectedMilestone.title}
              </h3>
              <p className="text-warning font-mono-num fw-bold fs-5 mb-2">
                {selectedMilestone.rewardValue}
              </p>
              <p className="text-secondary small mb-3">
                {selectedMilestone.summary}
              </p>

              {/* Status Banner */}
              <div
                className="p-3 rounded-4 mb-3 text-start"
                style={{
                  background: 'rgba(19, 11, 38, 0.85)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-secondary small fw-bold">MILESTONE STATUS</span>
                  {currentStreak >= selectedMilestone.days ? (
                    <span className="badge bg-success font-mono-num">
                      <Check size={12} className="me-1" /> ACHIEVED & CLAIMED
                    </span>
                  ) : (
                    <span className="badge bg-warning text-dark font-mono-num">
                      {selectedMilestone.days - currentStreak} DAYS REMAINING
                    </span>
                  )}
                </div>

                {/* Digital Gift Card Code (if applicable) */}
                {selectedMilestone.voucherInr && (
                  <div
                    className="p-2 rounded-3 d-flex align-items-center justify-content-between mb-2"
                    style={{
                      background: 'rgba(11, 6, 24, 0.95)',
                      border: '1px dashed rgba(251, 191, 36, 0.55)',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Gift size={16} className="text-warning" />
                      <span className="text-secondary small font-mono-num">Voucher Code:</span>
                      <strong className="text-white font-mono-num small">{selectedMilestone.mockCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(selectedMilestone.mockCode)}
                      className="btn btn-sm btn-outline-warning py-0 px-2"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      <span className="ms-1">{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Perks Checklist */}
                <div className="small text-secondary mb-1 fw-bold">UNLOCKED REWARDS & PERKS:</div>
                <ul className="list-unstyled m-0 d-flex flex-column gap-1 small text-light">
                  {selectedMilestone.perks.map((perk, idx) => (
                    <li key={idx} className="d-flex align-items-start gap-2">
                      <CheckCircle2 size={14} className="text-success flex-shrink-0 mt-1" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
                <button
                  type="button"
                  onClick={triggerConfettiAnimation}
                  className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill d-inline-flex align-items-center gap-2"
                  style={{
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <Sparkles size={16} />
                  <span>Celebrate Reward Animation!</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareAchievement(selectedMilestone)}
                  className="btn btn-outline-light px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2"
                >
                  <Share2 size={15} />
                  <span>Share Achievement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
