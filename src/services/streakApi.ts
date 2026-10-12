export interface RewardConfigItem {
  rewardId: string;
  day: number;
  rewardType: 'VES' | 'GIFT_CARD';
  currency: 'VES' | 'INR';
  amount: number;
  displayValue: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string | null;
  assetType: 'coin' | 'gift-box' | 'gift-card' | 'crown';
  isUltimate: boolean;
  active: boolean;
}

export interface RewardCardState {
  day: number;
  status: 'LOCKED' | 'AVAILABLE' | 'TODAY' | 'CLAIMED' | 'MISSED';
  buttonLabel: 'Claim Reward' | 'Claimed' | 'Locked';
  isClaimable: boolean;
  isTodayTarget: boolean;
  nextClaimAt: string | null;
  claimedAt: string | null;
  reward: RewardConfigItem;
}

export interface StreakDataResponse {
  success: boolean;
  serverTime: string;
  user: {
    userId: string;
    name: string;
    email: string;
  };
  wallet: {
    userId: string;
    veBalance: number;
    giftCardBalanceInr: number;
    updatedAt: string;
  };
  streak: {
    cycleId: string;
    cycleNumber: number;
    currentStreak: number;
    currentDay: number;
    checkedIn: number;
    totalRewards: number;
    status: string;
    canClaimToday: boolean;
    nextClaimAt: string | null;
    expireAt: string | null;
    wasReset: boolean;
    resetReason: string | null;
  };
  statistics: {
    totalRewards: number;
    checkedIn: number;
    nextReward: {
      day: number;
      amount: number;
      currency: string;
      displayValue: string;
      subtitle: string;
      label: string;
    };
  };
  ultimateReward: {
    day: number;
    title: string;
    amount: number;
    currency: string;
    displayValue: string;
    subtitle: string;
    unlockText: string;
    status: string;
    assetType: string;
  };
  rewards: RewardCardState[];
}

export interface MagicCaptionItem {
  id: string;
  topText: string;
  bottomText: string;
  fullCaption: string;
  styleTag: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  maskedEmail: string;
  initials: string;
  currentStreak: number;
  longestStreak: number;
  currentDay: number;
  cyclesCompleted: number;
  cycleStatus: string;
  veBalance: number;
  giftCardBalanceInr: number;
  tierBadge: string;
  lastClaimedAt: string | null;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  success: boolean;
  serverTime: string;
  aggregationPipeline: string;
  summary: {
    totalParticipants: number;
    highestStreakDays: number;
    totalVesDistributed: number;
    totalGiftCardsDistributedInr: number;
  };
  leaderboard: LeaderboardEntry[];
  currentUserStanding: {
    entry: LeaderboardEntry | null;
    inTopTen: boolean;
    daysToReachTopTen: number;
  };
}

const TOKEN_STORAGE_KEY = 'veloop_jwt_token_v1';

class StreakApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async login(email?: string, userId?: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  public async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      await this.login('demo@velooprewards.in');
    }
  }

  public async getStreak(): Promise<StreakDataResponse> {
    await this.ensureAuthenticated();
    const res = await fetch('/api/daily-streak', {
      headers: this.getAuthHeaders(),
    });
    if (res.status === 401) {
      await this.login('demo@velooprewards.in');
      const retry = await fetch('/api/daily-streak', {
        headers: this.getAuthHeaders(),
      });
      return retry.json();
    }
    return res.json();
  }

  public async getStreakStatus() {
    await this.ensureAuthenticated();
    const res = await fetch('/api/daily-streak/status', {
      headers: this.getAuthHeaders(),
    });
    return res.json();
  }

  public async claimStreak(payload: Record<string, unknown> = {}) {
    await this.ensureAuthenticated();
    let locationData: { latitude?: number; longitude?: number; accuracy?: number } = {};
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, maximumAge: 60000 });
        });
        locationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      } catch {
        // Geolocation optional fallback if denied or unavailable
      }
    }

    const res = await fetch('/api/daily-streak/claim', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ...locationData, ...payload }),
    });
    const data = await res.json();
    return { httpStatus: res.status, ...data };
  }

  public async getHistory() {
    await this.ensureAuthenticated();
    const res = await fetch('/api/daily-streak/history', {
      headers: this.getAuthHeaders(),
    });
    return res.json();
  }

  public async getLeaderboard(limit = 10): Promise<LeaderboardResponse> {
    await this.ensureAuthenticated();
    const res = await fetch(`/api/daily-streak/leaderboard?limit=${encodeURIComponent(limit)}`, {
      headers: this.getAuthHeaders(),
    });
    if (res.status === 401) {
      await this.login('demo@velooprewards.in');
      const retry = await fetch(`/api/daily-streak/leaderboard?limit=${encodeURIComponent(limit)}`, {
        headers: this.getAuthHeaders(),
      });
      return retry.json();
    }
    return res.json();
  }

  public async getWallet() {
    await this.ensureAuthenticated();
    const res = await fetch('/api/wallet', {
      headers: this.getAuthHeaders(),
    });
    return res.json();
  }

  public async simulateBackendAction(payload: {
    action:
      | 'ADVANCE_TIME'
      | 'FAST_FORWARD_TIMER'
      | 'PRESET_DAY1_FRESH'
      | 'PRESET_DESIGN_REF'
      | 'UPDATE_REWARD_CONFIG';
    hours?: number;
    day?: number;
    newAmount?: number;
  }) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/daily-streak/simulate', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  public async getDatabaseSnapshot() {
    await this.ensureAuthenticated();
    const res = await fetch('/api/debug/database', {
      headers: this.getAuthHeaders(),
    });
    return res.json();
  }

  // AI Meme & Promo Studio API Calls (Authenticated with JWT Bearer token)
  public async generateMagicCaptions(params: {
    imageBase64: string;
    mimeType?: string;
    templateTitle?: string;
    customTopic?: string;
  }) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/magic-captions', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  public async analyzeImage(params: { imageBase64: string; mimeType?: string; question?: string }) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  public async generateOrEditImage(params: {
    prompt: string;
    sourceImageBase64?: string;
    mimeType?: string;
    mode: 'create' | 'edit';
  }) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  public async enhancePrompt(prompt: string) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/enhance-prompt', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ prompt }),
    });
    return res.json();
  }

  public async analyzeMemeScore(imageBase64: string, mimeType?: string) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/meme-score', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    return res.json();
  }

  public async generateAltText(imageBase64: string, mimeType?: string) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/alt-text', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    return res.json();
  }

  public async generateImageSocialPackage(imageBase64: string, mimeType?: string, platform = 'Instagram') {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/image-to-post', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ imageBase64, mimeType, platform }),
    });
    return res.json();
  }

  public async generateSocialPost(topic: string, platform = 'Instagram', tone = 'funny') {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/social-post', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ topic, platform, tone }),
    });
    return res.json();
  }

  public async generateHashtags(topic: string, count = 15) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/hashtags', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ topic, count }),
    });
    return res.json();
  }

  public async generateMemeTitles(topic: string) {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/meme-title', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ topic }),
    });
    return res.json();
  }

  public async rewriteContent(text: string, style = 'engaging') {
    await this.ensureAuthenticated();
    const res = await fetch('/api/ai/rewrite', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, style }),
    });
    return res.json();
  }
}

export const streakApi = new StreakApiService();
