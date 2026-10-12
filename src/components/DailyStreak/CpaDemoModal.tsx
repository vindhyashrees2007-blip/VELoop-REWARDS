import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface CpaDemoModalProps {
  isOpen: boolean;
  day: number;
  rewardLabel: string;
  onVerificationComplete: () => void;
}

/**
 * Sections 7 & 68: CPA Advertisement Demo State
 * Important: This demo state does NOT itself grant the reward.
 * The backend independently validates and controls the actual reward claim & wallet transaction.
 */
export function CpaDemoModal({ isOpen, day, rewardLabel, onVerificationComplete }: CpaDemoModalProps) {
  const [progress, setProgress] = useState(15);
  const [stepText, setStepText] = useState('Preparing your reward...');

  useEffect(() => {
    if (!isOpen) {
      setProgress(15);
      setStepText('Preparing your reward...');
      return;
    }

    const t1 = setTimeout(() => {
      setProgress(55);
      setStepText('Advertisement / Reward Verification in progress...');
    }, 550);

    const t2 = setTimeout(() => {
      setProgress(90);
      setStepText('Confirming eligibility with VELoop Backend Ledger...');
    }, 1150);

    const t3 = setTimeout(() => {
      setProgress(100);
      onVerificationComplete();
    }, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, onVerificationComplete]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(6, 3, 15, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 24,
          background: 'linear-gradient(165deg, #211242 0%, #110926 100%)',
          border: '1.5px solid rgba(251, 191, 36, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 35px rgba(139, 92, 246, 0.25)',
          padding: '1.75rem',
          textAlign: 'center',
          color: '#f8fafc',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.85rem',
            borderRadius: 999,
            background: 'rgba(245, 158, 11, 0.16)',
            border: '1px solid rgba(251, 191, 36, 0.4)',
            color: '#fde047',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}
        >
          <Sparkles size={14} /> CPA SPONSORED VERIFICATION DEMO
        </div>

        <h3 className="h5 fw-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Day {day} Reward Check-In
        </h3>
        <p className="text-warning fw-bold mb-3" style={{ fontSize: '1.1rem' }}>
          {rewardLabel}
        </p>

        {/* Sponsored Partner Placeholder Box */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(12, 7, 26, 0.85)',
            border: '1px dashed rgba(167, 139, 250, 0.4)',
            padding: '1.25rem 1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div className="d-flex align-items-center justify-content-center gap-2 text-info mb-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="fw-semibold small">Advertisement / Reward Verification</span>
          </div>
          <p className="text-light small m-0">{stepText}</p>
          <p className="text-secondary m-0 mt-1" style={{ fontSize: '0.74rem' }}>
            Please wait...
          </p>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #f59e0b 100%)',
              transition: 'width 350ms ease',
            }}
          />
        </div>

        <div className="d-flex align-items-center justify-content-center gap-2 text-secondary" style={{ fontSize: '0.74rem' }}>
          <ShieldCheck size={15} className="text-success" />
          <span>Reward grant is strictly verified by the VELoop Backend Server</span>
          {progress === 100 && <CheckCircle2 size={15} className="text-success" />}
        </div>
      </div>
    </div>
  );
}
