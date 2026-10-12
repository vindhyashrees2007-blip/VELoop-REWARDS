import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../config/db.ts';
import { AuthenticatedRequest, requireAuth, signUserToken } from '../middleware/auth.middleware.ts';
import { streakService } from '../services/streak.service.ts';
import { walletService } from '../services/wallet.service.ts';
import { rewardService } from '../services/reward.service.ts';

export const streakRouter = Router();

const PROJECT_CODE_FILES = [
  'package.json',
  '.env.example',
  'server.ts',
  'src/backend/models/schemas.ts',
  'src/backend/config/db.ts',
  'src/backend/middleware/auth.middleware.ts',
  'src/backend/services/reward.service.ts',
  'src/backend/services/wallet.service.ts',
  'src/backend/services/streak.service.ts',
  'src/backend/routes/streak.routes.ts',
  'src/backend/routes/ai.routes.ts',
  'src/services/streakApi.ts',
  'src/pages/DailyStreak/DailyStreak.module.css',
  'src/components/DailyStreak/RewardArtwork.tsx',
  'src/components/DailyStreak/StreakLoaderAndSkeleton.tsx',
  'src/components/DailyStreak/CpaDemoModal.tsx',
  'src/components/DailyStreak/StreakLeaderboard.tsx',
  'src/components/DailyStreak/StreakMilestoneProgress.tsx',
  'src/components/DailyStreak/DailyStreakPage.tsx',
  'src/components/AiMemeStudio/AiMemeStudio.tsx',
  'src/App.tsx',
  'src/index.css',
  'README.md',
  'docs/API_DOCUMENTATION.md',
  'docs/DATABASE.md',
  'docs/SECURITY.md',
  'docs/TESTING.md',
  'postman/VELoop_Daily_Streak.postman_collection.json',
];

function collectAllProjectFiles(): Array<{ filePath: string; content: string }> {
  const results: Array<{ filePath: string; content: string }> = [];
  for (const relPath of PROJECT_CODE_FILES) {
    try {
      const absPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(absPath)) {
        const content = fs.readFileSync(absPath, 'utf-8');
        results.push({ filePath: `/${relPath}`, content });
      }
    } catch {
      // skip unreadable file
    }
  }
  return results;
}

function escapePdfString(str: string): string {
  // Replace non-ASCII characters with safe ASCII equivalents for Type1 Courier PDF encoding
  const ascii = str
    .replace(/₹/g, 'INR ')
    .replace(/→/g, '->')
    .replace(/✓/g, '[OK]')
    .replace(/✦/g, '*')
    .replace(/[^\x20-\x7E]/g, '');
  return ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function generateCompleteCodePdfBuffer(files: Array<{ filePath: string; content: string }>): Buffer {
  const allLines: Array<{ text: string; bold?: boolean }> = [];
  allLines.push({ text: '================================================================================', bold: true });
  allLines.push({ text: 'VELOOP REWARDS - DAILY STREAK SYSTEM & AI MEME STUDIO (COMPLETE CODEBASE)', bold: true });
  allLines.push({ text: 'INTERN NAME : Vindhyashree S', bold: true });
  allLines.push({ text: 'INTERN ID   : VLRINT202601730', bold: true });
  allLines.push({ text: `Generated At: ${new Date().toISOString()}`, bold: false });
  allLines.push({ text: '================================================================================', bold: true });
  allLines.push({ text: '' });
  allLines.push({ text: 'INCLUDED PROJECT FILES:', bold: true });
  files.forEach((f, idx) => {
    allLines.push({ text: `  ${String(idx + 1).padStart(2, '0')}. ${f.filePath}` });
  });
  allLines.push({ text: '' });

  const maxLineWidth = 92;

  for (const file of files) {
    allLines.push({ text: '--------------------------------------------------------------------------------', bold: true });
    allLines.push({ text: `FILE: ${file.filePath}`, bold: true });
    allLines.push({ text: '--------------------------------------------------------------------------------', bold: true });

    const rawLines = file.content.split(/\r?\n/);
    rawLines.forEach((rawLine, idx) => {
      const numbered = `${String(idx + 1).padStart(4, ' ')} | ${rawLine.replace(/\t/g, '  ')}`;
      if (numbered.length <= maxLineWidth) {
        allLines.push({ text: numbered });
      } else {
        let pos = 0;
        while (pos < numbered.length) {
          const chunk = pos === 0 ? numbered.slice(0, maxLineWidth) : `       ${numbered.slice(pos, pos + maxLineWidth - 7)}`;
          allLines.push({ text: chunk });
          pos += pos === 0 ? maxLineWidth : maxLineWidth - 7;
        }
      }
    });
    allLines.push({ text: '' });
  }

  const linesPerPage = 62;
  const pages: Array<Array<{ text: string; bold?: boolean }>> = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pages.push(allLines.slice(i, i + linesPerPage));
  }

  const objects: string[] = [];
  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  // Obj 2: Pages placeholder (filled after pages are created)
  objects.push('');
  // Obj 3: Courier regular font
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n');
  // Obj 4: Courier-Bold font
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n');

  const pageObjNums: number[] = [];

  pages.forEach((pageLines, pageIdx) => {
    const pageObjNum = objects.length + 1;
    const contentObjNum = objects.length + 2;
    pageObjNums.push(pageObjNum);

    const streamOps: string[] = [];
    streamOps.push('BT');
    streamOps.push('/F2 8.5 Tf');
    streamOps.push('32 762 Td');
    streamOps.push(
      `(VELoop Rewards | Intern: Vindhyashree S (VLRINT202601730) | Page ${pageIdx + 1} of ${pages.length}) Tj`
    );
    streamOps.push('0 -16 Td');

    for (const line of pageLines) {
      streamOps.push(line.bold ? '/F2 8 Tf' : '/F1 8 Tf');
      streamOps.push(`(${escapePdfString(line.text)}) Tj`);
      streamOps.push('0 -11.2 Td');
    }
    streamOps.push('ET');

    const streamBody = streamOps.join('\n');
    const streamByteLen = Buffer.byteLength(streamBody, 'utf-8');

    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
    );
    objects.push(
      `${contentObjNum} 0 obj\n<< /Length ${streamByteLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
  });

  const kidsRef = pageObjNums.map((n) => `${n} 0 R`).join(' ');
  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${pageObjNums.length} >>\nendobj\n`;

  let pdfContent = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const objStr of objects) {
    offsets.push(Buffer.byteLength(pdfContent, 'utf-8'));
    pdfContent += objStr;
  }

  const xrefStart = Buffer.byteLength(pdfContent, 'utf-8');
  pdfContent += `xref\n0 ${objects.length + 1}\n`;
  pdfContent += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdfContent += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdfContent += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdfContent, 'utf-8');
}

/**
 * GET /api/export/complete-code.pdf
 * Downloads the entire project source code and documentation in a single multi-page PDF file.
 */
streakRouter.get('/export/complete-code.pdf', (_req: Request, res: Response) => {
  try {
    const files = collectAllProjectFiles();
    const pdfBuffer = generateCompleteCodePdfBuffer(files);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="VELoop_Rewards_Vindhyashree_S_VLRINT202601730_Codebase.pdf"'
    );
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
  }
});

/**
 * GET /api/export/complete-codebase
 * Returns all project files as JSON for in-app viewing and copy/print.
 */
streakRouter.get('/export/complete-codebase', (_req: Request, res: Response) => {
  const files = collectAllProjectFiles();
  res.json({
    success: true,
    totalFiles: files.length,
    files,
  });
});

/**
 * POST /api/auth/login
 * Authenticates a user (or returns demo user JWT token)
 */
streakRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, name, userId } = req.body || {};
    const collections = db.getCollections();

    let user = collections.users.find(
      (u) => (email && u.email.toLowerCase() === String(email).toLowerCase().trim()) || (userId && u.userId === userId)
    );

    if (!user && email && String(email).includes('@')) {
      const cleanEmail = String(email).toLowerCase().trim();
      const nowIso = new Date().toISOString();
      const newUserId = `USR_${Date.now().toString(36).toUpperCase()}`;
      user = {
        userId: newUserId,
        email: cleanEmail,
        name: name ? String(name).trim() : cleanEmail.split('@')[0],
        passwordHash: 'veloop_hashed_custom',
        eligible: true,
        serverTimeOffsetMs: 0,
        createdAt: nowIso,
      };
      collections.users.push(user);
      walletService.getOrCreateWallet(newUserId, nowIso);
    }

    if (!user) {
      user = collections.users[0];
    }

    const token = signUserToken(user);
    const nowIso = new Date(streakService.getServerNowMs(user.userId)).toISOString();

    collections.auditLogs.push({
      logId: `AUD_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.userId,
      eventType: 'AUTH_LOGIN',
      reason: `User authenticated via JWT (${user.email}).`,
      serverTimestamp: nowIso,
    });
    await db.commit();

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
      },
      availableAccounts: collections.users.map((u) => ({
        userId: u.userId,
        email: u.email,
        name: u.name,
      })),
    });
  } catch {
    res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Unable to authenticate at this time. Please try again.',
    });
  }
});

/**
 * GET /api/daily-streak
 * Returns complete backend-calculated Daily Streak state, reward cards, statistics, and wallet
 */
streakRouter.get('/daily-streak', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId!;
    const state = await streakService.getStreakState(userId);
    res.json(state);
  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Unable to load your streak right now. Please try again.',
    });
  }
});

/**
 * GET /api/daily-streak/status
 * Lightweight status endpoint for timer completion verification and polling
 */
streakRouter.get('/daily-streak/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId!;
    const state = await streakService.getStreakState(userId);
    res.json({
      success: true,
      serverTime: state.serverTime,
      streak: state.streak,
      statistics: state.statistics,
      wallet: state.wallet,
      rewards: state.rewards,
    });
  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Unable to verify streak status. Please try again.',
    });
  }
});

/**
 * POST /api/daily-streak/claim
 * Authoritative backend reward claim endpoint with full anti-cheat & idempotency validation
 */
streakRouter.post('/daily-streak/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId!;
    const result = await streakService.claimDailyReward(userId, req.body || {});
    res.status(result.statusCode).json(result.body);
  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Unable to process your reward. Please try again.',
    });
  }
});

/**
 * GET /api/daily-streak/history
 * Returns user's claim history, cycle history, wallet ledger, and security audit logs
 */
streakRouter.get('/daily-streak/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId!;
    const history = streakService.getUserHistory(userId);
    res.json({
      success: true,
      serverTime: new Date(streakService.getServerNowMs(userId)).toISOString(),
      ...history,
    });
  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Unable to fetch streak history.',
    });
  }
});

/**
 * GET /api/daily-streak/leaderboard (and alias GET /api/leaderboard)
 * Retrieves aggregated rank data for the top N (default 10) users with the longest streaks
 */
const handleGetLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId;
    const limitParam = req.query.limit ? Number(req.query.limit) : 10;
    const leaderboardData = streakService.getLeaderboard(userId, limitParam);
    res.json(leaderboardData);
  } catch {
    res.status(500).json({
      success: false,
      code: 'LEADERBOARD_ERROR',
      message: 'Unable to retrieve aggregated streak leaderboard.',
    });
  }
};

streakRouter.get('/daily-streak/leaderboard', requireAuth, handleGetLeaderboard);
streakRouter.get('/leaderboard', requireAuth, handleGetLeaderboard);

/**
 * GET /api/wallet
 * Returns user's current backend wallet and transaction ledger
 */
streakRouter.get('/wallet', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId!;
    const nowIso = new Date(streakService.getServerNowMs(userId)).toISOString();
    const wallet = walletService.getOrCreateWallet(userId, nowIso);
    const transactions = walletService.getUserTransactions(userId);
    res.json({
      success: true,
      serverTime: nowIso,
      wallet,
      transactions,
    });
  } catch {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Unable to retrieve wallet balance.',
    });
  }
});

/**
 * POST /api/daily-streak/simulate
 * Evaluator / Development testing endpoint to advance server time (+24h / +49h) or reset state
 */
streakRouter.post('/daily-streak/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.authUserId!;
    const { action, hours, day, newAmount } = req.body || {};

    if (action === 'ADVANCE_TIME') {
      const hrs = Number(hours) || 24;
      await streakService.simulateTimeTravel(userId, hrs);
    } else if (action === 'FAST_FORWARD_TIMER') {
      await streakService.fastForwardTimerToSeconds(userId, 4);
    } else if (action === 'PRESET_DAY1_FRESH') {
      await streakService.resetUserToPreset(userId, 'DAY1_FRESH');
    } else if (action === 'PRESET_DESIGN_REF') {
      await streakService.resetUserToPreset(userId, 'DAY2_READY_DESIGN_REF');
    } else if (action === 'SET_MILESTONE') {
      const targetDays = Number(req.body?.milestoneDays || req.body?.days) || 7;
      await streakService.setStreakMilestone(userId, targetDays);
    } else if (action === 'UPDATE_REWARD_CONFIG') {
      const targetDay = Number(day) || 2;
      const amt = Number(newAmount) || 15;
      const rewards = db.getCollections().streakRewards;
      const r = rewards.find((item) => item.day === targetDay);
      if (r) {
        r.amount = amt;
        r.displayValue = r.currency === 'VES' ? `+${amt}` : `₹${amt}`;
        r.subtitle = r.currency === 'VES' ? `${amt} VEs` : 'Amazon Gift Card';
        await db.commit();
      }
    }

    const updatedState = await streakService.getStreakState(userId);
    res.json({
      success: true,
      message: `Simulation "${action}" applied on backend.`,
      state: updatedState,
    });
  } catch {
    res.status(500).json({
      success: false,
      code: 'SIMULATION_ERROR',
      message: 'Unable to run simulation.',
    });
  }
});

/**
 * GET /api/debug/database
 * Allows the evaluator to inspect the live MongoDB / Document Store collections directly (Section 104)
 */
streakRouter.get('/debug/database', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  const collections = db.getCollections();
  res.json({
    success: true,
    mongooseConnected: db.isMongooseConnected,
    config: rewardService.getStreakConfig(),
    collections: {
      users: collections.users.map(({ passwordHash: _p, ...u }) => u),
      wallets: collections.wallets,
      streakConfigs: collections.streakConfigs,
      streakRewards: collections.streakRewards,
      streakCycles: collections.streakCycles,
      streakClaims: collections.streakClaims,
      walletTransactions: collections.walletTransactions,
      auditLogs: collections.auditLogs.slice(-50).reverse(),
    },
  });
});
