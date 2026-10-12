/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  BookOpen,
  Download,
  Copy,
  Check,
  FileCode,
  CheckCircle2,
  KeyRound,
  FileJson,
  Loader2,
  Trophy,
  UserCheck,
  Mail,
} from 'lucide-react';
import { DailyStreakPage } from './components/DailyStreak/DailyStreakPage.tsx';
import { StreakLeaderboard } from './components/DailyStreak/StreakLeaderboard.tsx';
import { AiMemeStudio } from './components/AiMemeStudio/AiMemeStudio.tsx';
import { WorkspaceMapsHub } from './components/WorkspaceMapsHub/WorkspaceMapsHub.tsx';

async function triggerBlobDownload(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}

function InternSubmissionAndCodePage() {
  const [files, setFiles] = useState<Array<{ filePath: string; content: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetch('/api/export/complete-codebase')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopyFile = (filePath: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPath(filePath);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleCopyAllCode = () => {
    const headerBanner = `// ============================================================================\n// VELOOP REWARDS — FULL-STACK MERN INTERNSHIP SUBMISSION\n// INTERN NAME : Vindhyashree S\n// INTERN ID   : VLRINT202601730\n// ============================================================================\n\n`;
    const combined =
      headerBanner +
      files
        .map((f) => `// ==========================================\n// FILE: ${f.filePath}\n// ==========================================\n\n${f.content}`)
        .join('\n\n\n');
    navigator.clipboard.writeText(combined);
    setCopiedPath('ALL_FILES');
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await triggerBlobDownload(
        '/api/export/complete-code.pdf',
        'VELoop_Rewards_Vindhyashree_S_VLRINT202601730_Codebase.pdf'
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="container py-4 text-light" style={{ maxWidth: 1240 }}>
      {/* Top Intern Submission Banner */}
      <div
        className="p-4 rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(35, 18, 68, 0.96) 0%, rgba(16, 10, 34, 0.98) 100%)',
          border: '1.5px solid rgba(251, 191, 36, 0.5)',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <span className="text-warning small fw-bold">
              VELOOP REWARDS — FULL-STACK MERN INTERNSHIP SUBMISSION PACKAGE
            </span>
            <span
              className="badge rounded-pill font-mono-num"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.5)',
                color: '#6ee7b7',
                fontSize: '0.74rem',
              }}
            >
              <UserCheck size={12} className="me-1" />
              Intern Name: Vindhyashree S | Intern ID: VLRINT202601730
            </span>
          </div>
          <h1 className="h3 fw-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Complete Source Code, Documentation & Single-PDF Export
          </h1>
          <p className="text-secondary small m-0">
            Submitted by <strong className="text-white">Vindhyashree S</strong> (Intern ID:{' '}
            <code className="text-warning">VLRINT202601730</code>) — All {files.length || 23} production files (MERN
            Backend, Mongoose Models, JWT Auth, 24h Server Timer, Top 10 StreakLeaderboard, React + Bootstrap + CSS
            Modules Frontend, Docs &amp; Postman Collection).
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handleDownloadPdf}
            className="btn btn-warning fw-bold text-dark d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
            }}
          >
            {downloadingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Complete Code in One PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllCode}
            className="btn btn-outline-light d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3"
          >
            {copiedPath === 'ALL_FILES' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            <span>{copiedPath === 'ALL_FILES' ? 'Copied All 22 Files!' : 'Copy Entire Codebase'}</span>
          </button>
        </div>
      </div>

      {/* Section 122: Intern Final Submission Checklist & Demo Credentials */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div
            className="p-3 rounded-4 h-100"
            style={{
              background: 'rgba(19, 12, 38, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <KeyRound size={18} className="text-warning" />
              <h2 className="h6 fw-bold text-white m-0">Demo Credentials & Evaluator Quick-Start</h2>
            </div>
            <ul className="small text-light mb-0 ps-3">
              <li className="mb-1">
                <strong>Primary Demo Account (Design Reference State):</strong>{' '}
                <code>demo@velooprewards.in</code> / <code>demo123</code> (Day 1 Claimed, Wallet = 120 VEs, Day 2 Ready to Claim)
              </li>
              <li className="mb-1">
                <strong>Fresh User Account (Day 1 Ready):</strong>{' '}
                <code>fresh@velooprewards.in</code> / <code>fresh123</code> (0 Claimed, Wallet = 100 VEs, Day 1 Ready to Claim)
              </li>
              <li>
                <strong>Evaluator Controls:</strong> Use the top bar on the Daily Streak page to test{' '}
                <em>+24h Unlock Next Day</em>, <em>+49h Missed-Day Streak Reset</em>, <em>4s Live Countdown Unlock</em>,
                and the <em>6-Test Anti-Cheat Suite</em>.
              </li>
            </ul>
          </div>
        </div>

        <div className="col-md-6">
          <div
            className="p-3 rounded-4 h-100"
            style={{
              background: 'rgba(19, 12, 38, 0.92)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <h2 className="h6 fw-bold text-white m-0">Section 122 Final Submission Checklist</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  const postmanFile = files.find((f) => f.filePath.includes('postman_collection.json'));
                  if (postmanFile) {
                    const blob = new Blob([postmanFile.content], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'VELoop_Daily_Streak.postman_collection.json';
                    a.click();
                  }
                }}
                className="btn btn-sm btn-outline-info py-0 px-2 d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.72rem' }}
              >
                <FileJson size={13} /> Download Postman JSON
              </button>
            </div>
            <div className="row small text-secondary g-1">
              <div className="col-6 text-light">✓ Node.js + Express + Mongoose</div>
              <div className="col-6 text-light">✓ JWT Auth & Ownership Check</div>
              <div className="col-6 text-light">✓ Backend 24h Timer & Reset</div>
              <div className="col-6 text-light">✓ Atomic Concurrency Lock</div>
              <div className="col-6 text-light">✓ Wallet Ledger & Audit Logs</div>
              <div className="col-6 text-light">✓ Bootstrap + CSS Modules UI</div>
              <div className="col-6 text-light">✓ CPA Ad Demo & Skeleton</div>
              <div className="col-6 text-light">✓ README, API, DB, Security & Testing Docs</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-secondary">Loading complete codebase index...</div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {files.map((file, idx) => (
            <div
              key={file.filePath}
              className="rounded-4 overflow-hidden"
              style={{
                background: '#0d071c',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <div
                className="d-flex align-items-center justify-content-between px-3 py-2"
                style={{
                  background: 'rgba(30, 18, 58, 0.9)',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <FileCode size={16} className="text-warning" />
                  <span className="font-mono-num fw-bold text-white small">
                    {String(idx + 1).padStart(2, '0')}. {file.filePath}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyFile(file.filePath, file.content)}
                  className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1 py-0 px-2"
                  style={{ fontSize: '0.74rem' }}
                >
                  {copiedPath === file.filePath ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  <span>{copiedPath === file.filePath ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre
                className="p-3 m-0 font-mono-num small text-light"
                style={{
                  maxHeight: 420,
                  overflow: 'auto',
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                }}
              >
                {file.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MainWorkspace() {
  const navigate = useNavigate();
  const [downloadingHeaderPdf, setDownloadingHeaderPdf] = useState(false);

  const handleHeaderPdfDownload = async () => {
    setDownloadingHeaderPdf(true);
    try {
      await triggerBlobDownload(
        '/api/export/complete-code.pdf',
        'VELoop_Rewards_Vindhyashree_S_VLRINT202601730_Codebase.pdf'
      );
    } finally {
      setDownloadingHeaderPdf(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080512' }}>
      {/* Top 3-Zone Navigation Bar Contract */}
      <nav
        style={{
          background: 'rgba(11, 6, 24, 0.96)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.24)',
          padding: '0.65rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 1020,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            maxWidth: 1340,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Zone 1: Single Brand Wordmark */}
          <NavLink
            to="/"
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#ffffff',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            VELoop Rewards
          </NavLink>

          {/* Zone 2: Clean Navigation Links */}
          <div className="d-flex align-items-center gap-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 ${
                  isActive ? 'text-warning' : 'text-secondary'
                }`
              }
            >
              <Flame size={15} />
              <span>Daily Streak</span>
            </NavLink>

            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 ${
                  isActive ? 'text-warning' : 'text-secondary'
                }`
              }
            >
              <Trophy size={15} />
              <span>Leaderboard</span>
            </NavLink>

            <NavLink
              to="/ai-studio"
              className={({ isActive }) =>
                `small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 ${
                  isActive ? 'text-warning' : 'text-secondary'
                }`
              }
            >
              <Sparkles size={15} />
              <span>AI Meme Studio</span>
            </NavLink>

            <NavLink
              to="/workspace-maps"
              className={({ isActive }) =>
                `small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 ${
                  isActive ? 'text-warning' : 'text-secondary'
                }`
              }
            >
              <Mail size={15} />
              <span>Workspace &amp; Maps</span>
            </NavLink>

            <NavLink
              to="/docs"
              className={({ isActive }) =>
                `small fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 ${
                  isActive ? 'text-warning' : 'text-secondary'
                }`
              }
            >
              <BookOpen size={15} />
              <span>Intern Submission & PDF</span>
            </NavLink>
          </div>

          {/* Zone 3: Primary Actions (Download Complete Code PDF + Magic Caption Studio) */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              disabled={downloadingHeaderPdf}
              onClick={handleHeaderPdfDownload}
              className="btn btn-sm fw-bold text-dark px-3 py-1 rounded-3 whitespace-nowrap d-inline-flex align-items-center gap-1"
              style={{
                background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)',
                fontSize: '0.78rem',
              }}
            >
              {downloadingHeaderPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloadingHeaderPdf ? 'Saving PDF...' : 'Download Code PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ai-studio')}
              className="btn btn-sm btn-outline-light px-3 py-1 rounded-3 whitespace-nowrap d-none d-md-inline-flex"
              style={{ fontSize: '0.78rem' }}
            >
              Magic Caption Studio
            </button>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<DailyStreakPage onNavigateToAiStudio={() => navigate('/ai-studio')} />} />
        <Route
          path="/daily-streak"
          element={<DailyStreakPage onNavigateToAiStudio={() => navigate('/ai-studio')} />}
        />
        <Route
          path="/leaderboard"
          element={
            <div className="container py-4" style={{ maxWidth: 1340 }}>
              <StreakLeaderboard />
            </div>
          }
        />
        <Route path="/workspace-maps" element={<WorkspaceMapsHub />} />
        <Route path="/ai-studio" element={<AiMemeStudio />} />
        <Route path="/docs" element={<InternSubmissionAndCodePage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainWorkspace />
    </BrowserRouter>
  );
}
