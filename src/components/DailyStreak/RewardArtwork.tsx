import React, { useState } from 'react';
import styles from '../../pages/DailyStreak/DailyStreak.module.css';

import crownImgUrl from '../../assets/images/veloop_golden_crown_pedestal_1790488030408.jpg';
import giftCoinsImgUrl from '../../assets/images/veloop_gift_box_coins_1790488044698.jpg';

export function GoldCoinsArtwork({ size = 66 }: { size?: number }) {
  return (
    <div
      className={styles.animateFloat}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="coinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="goldTop" x1="15" y1="15" x2="65" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="goldSide" x1="15" y1="30" x2="65" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="42" r="34" fill="url(#coinGlow)" />
        {/* Bottom coin */}
        <path d="M22 52C22 57 31 61 42 61C53 61 62 57 62 52V57C62 62 53 66 42 66C31 66 22 62 22 57V52Z" fill="url(#goldSide)" />
        <ellipse cx="42" cy="52" rx="20" ry="8.5" fill="url(#goldTop)" stroke="#FEF08A" strokeWidth="1" />
        {/* Middle coin */}
        <path d="M25 42C25 47 34 51 45 51C56 51 65 47 65 42V47C65 52 56 56 45 56C34 56 25 52 25 47V42Z" fill="url(#goldSide)" />
        <ellipse cx="45" cy="42" rx="20" ry="8.5" fill="url(#goldTop)" stroke="#FEF08A" strokeWidth="1" />
        {/* Top Tilted Coin with VR mark */}
        <path d="M18 31C18 36 27 40 38 40C49 40 58 36 58 31V36C58 41 49 45 38 45C27 45 18 41 18 36V31Z" fill="url(#goldSide)" />
        <ellipse cx="38" cy="31" rx="20" ry="9" fill="url(#goldTop)" stroke="#FEF9C3" strokeWidth="1.2" />
        <ellipse cx="38" cy="31" rx="15" ry="6.2" stroke="#B45309" strokeWidth="1" strokeDasharray="3 2" />
        <text
          x="38"
          y="34"
          textAnchor="middle"
          fill="#78350F"
          fontSize="9"
          fontWeight="900"
          fontFamily="Outfit, sans-serif"
        >
          VR
        </text>
        {/* Sparkles */}
        <circle cx="62" cy="22" r="2" fill="#FEF08A" />
        <circle cx="18" cy="20" r="1.5" fill="#FDE047" />
      </svg>
    </div>
  );
}

export function GiftBoxArtwork({ size = 66 }: { size?: number }) {
  return (
    <div
      className={styles.animateFloat}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="giftGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="purpleBox" x1="18" y1="26" x2="62" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id="ribbonGold" x1="30" y1="14" x2="50" y2="68" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="42" r="34" fill="url(#giftGlow)" />
        {/* Box Base */}
        <rect x="20" y="34" width="40" height="30" rx="5" fill="url(#purpleBox)" stroke="#C084FC" strokeWidth="1.2" />
        {/* Box Lid */}
        <rect x="17" y="26" width="46" height="10" rx="3.5" fill="#7E22CE" stroke="#D8B4FE" strokeWidth="1.2" />
        {/* Vertical & Horizontal Gold Ribbons */}
        <rect x="36" y="26" width="8" height="38" fill="url(#ribbonGold)" />
        <rect x="20" y="45" width="40" height="7" fill="url(#ribbonGold)" />
        {/* Gold Bow on top */}
        <path
          d="M40 26C33 16 23 18 26 25C28 28 35 26 40 26Z"
          fill="url(#ribbonGold)"
          stroke="#FEF08A"
          strokeWidth="1"
        />
        <path
          d="M40 26C47 16 57 18 54 25C52 28 45 26 40 26Z"
          fill="url(#ribbonGold)"
          stroke="#FEF08A"
          strokeWidth="1"
        />
        <circle cx="40" cy="25" r="3.5" fill="#FEF08A" />
      </svg>
    </div>
  );
}

export function AmazonGiftCardArtwork({ size = 66 }: { size?: number }) {
  return (
    <div
      className={styles.animateFloat}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="cardGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="darkCard" x1="12" y1="20" x2="68" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="34" fill="url(#cardGlow)" />
        <rect
          x="12"
          y="21"
          width="56"
          height="38"
          rx="8"
          fill="url(#darkCard)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <text
          x="40"
          y="44"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="24"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          a
        </text>
        {/* Golden smile curve */}
        <path
          d="M28 49C33 53.5 46 53.5 52 49"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M49 48L53 48.5L51.5 52" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function GoldenCrownArtwork({ size = 66, showPedestal = false }: { size?: number; showPedestal?: boolean }) {
  const [imgError, setImgError] = useState(false);

  if (showPedestal && !imgError) {
    return (
      <div
        className={styles.animateCrownGlow}
        style={{
          width: size,
          height: size,
          borderRadius: '18px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          boxShadow: '0 0 28px rgba(168, 85, 247, 0.35)',
          flexShrink: 0,
        }}
      >
        <img
          src={crownImgUrl}
          alt="Ultimate Reward Golden Crown on Pedestal"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.animateCrownGlow}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="crownAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="crownGrad" x1="16" y1="18" x2="64" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="35" fill="url(#crownAura)" />
        {showPedestal && (
          <>
            <ellipse cx="40" cy="64" rx="26" ry="7" fill="#581C87" stroke="#A855F7" strokeWidth="1.5" />
            <ellipse cx="40" cy="61" rx="22" ry="5.5" fill="#7E22CE" stroke="#E9D5FF" strokeWidth="1" />
          </>
        )}
        <path
          d="M16 50L12 26L28 36L40 18L52 36L68 26L64 50H16Z"
          fill="url(#crownGrad)"
          stroke="#FEF9C3"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="16" y="51" width="48" height="6" rx="3" fill="url(#crownGrad)" stroke="#FEF08A" strokeWidth="1" />
        <circle cx="12" cy="23" r="3" fill="#FEF08A" />
        <circle cx="40" cy="15" r="3.5" fill="#FEF08A" />
        <circle cx="68" cy="23" r="3" fill="#FEF08A" />
        <circle cx="40" cy="42" r="3" fill="#EF4444" stroke="#FEF08A" strokeWidth="1" />
        <circle cx="26" cy="43" r="2.2" fill="#A855F7" stroke="#FEF08A" strokeWidth="0.8" />
        <circle cx="54" cy="43" r="2.2" fill="#A855F7" stroke="#FEF08A" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

export function HeroGiftCoinsIllustration({ size = 112 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <div
        className={styles.animateFloat}
        style={{
          width: size,
          height: size,
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          flexShrink: 0,
        }}
      >
        <img
          src={giftCoinsImgUrl}
          alt="VELoop Daily Check-In Gift and VR Coins"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return <GiftBoxArtwork size={size} />;
}

export function RewardCardArtwork({
  assetType,
  size = 64,
}: {
  assetType: 'coin' | 'gift-box' | 'gift-card' | 'crown';
  size?: number;
}) {
  switch (assetType) {
    case 'gift-box':
      return <GiftBoxArtwork size={size} />;
    case 'gift-card':
      return <AmazonGiftCardArtwork size={size} />;
    case 'crown':
      return <GoldenCrownArtwork size={size} showPedestal={false} />;
    case 'coin':
    default:
      return <GoldCoinsArtwork size={size} />;
  }
}
