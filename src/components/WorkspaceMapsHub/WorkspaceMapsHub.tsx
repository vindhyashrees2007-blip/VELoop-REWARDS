import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Mail, MapPin, Send, Inbox, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Add Gmail scopes
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.modify');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function WorkspaceMapsHub() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Gmail states
  const [messages, setMessages] = useState<Array<{ id: string; threadId: string; snippet?: string; subject?: string }>>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('VELoop Rewards - Daily Streak & Milestone Notification');
  const [emailBody, setEmailBody] = useState('Congratulations! You have successfully maintained your VELoop Daily Streak and earned exclusive rewards.');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Map state
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number; description: string }>({
    name: 'VELoop Rewards Global Headquarters',
    lat: 37.7749,
    lng: -122.4194,
    description: 'Central Hub for Daily Streak & Milestone Verification',
  });

  const partnerHubs = [
    { name: 'San Francisco Flagship Lounge', lat: 37.7749, lng: -122.4194, description: 'VIP Streaker Lounge & Reward Redemption Center' },
    { name: 'Silicon Valley Innovation Hub', lat: 37.3861, lng: -122.0839, description: 'Century Streaker Club & Tech Partner Center' },
    { name: 'New York Central Hub', lat: 40.7128, lng: -74.0060, description: 'East Coast Milestone Celebration Center' },
    { name: 'Tokyo Tech Sanctuary', lat: 35.6762, lng: 139.6503, description: 'Asia-Pacific Streak Leaderboard Lounge' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        if (cachedAccessToken) {
          setAccessToken(cachedAccessToken);
          setNeedsAuth(false);
        } else {
          setNeedsAuth(true);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        cachedAccessToken = null;
        setNeedsAuth(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        setAccessToken(cachedAccessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchGmailMessages(cachedAccessToken);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoggingIn(false);
      isSigningIn = false;
    }
  };

  const fetchGmailMessages = async (token: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) {
        const detailed = await Promise.all(
          data.messages.slice(0, 6).map(async (m: { id: string; threadId: string }) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const detailData = await detailRes.json();
            const subjectHeader = detailData.payload?.headers?.find((h: any) => h.name === 'Subject');
            return {
              id: m.id,
              threadId: m.threadId,
              snippet: detailData.snippet || 'No snippet available',
              subject: subjectHeader?.value || '(No Subject)',
            };
          })
        );
        setMessages(detailed);
      }
    } catch (err) {
      console.error('Error fetching Gmail messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    const confirmed = window.confirm(`Are you sure you want to send this reward notification email to ${recipient}?`);
    if (!confirmed) return;

    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const emailContent = [
        `To: ${recipient}`,
        `Subject: ${emailSubject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        emailBody,
      ].join('\r\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (res.ok) {
        setEmailStatus({ success: true, message: `Successfully sent email to ${recipient}!` });
        setRecipient('');
      } else {
        const errData = await res.json();
        setEmailStatus({ success: false, message: errData.error?.message || 'Failed to send email.' });
      }
    } catch (err: any) {
      setEmailStatus({ success: false, message: err.message || 'Network error sending email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBG0MhkY0eRj12gSUVKjMwB0PF8Darzo5o';

  return (
    <div className="container py-4 text-light" style={{ maxWidth: 1340 }}>
      {/* Top Header Card */}
      <div
        className="p-4 rounded-4 mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(35, 18, 68, 0.96) 0%, rgba(16, 10, 34, 0.98) 100%)',
          border: '1.5px solid rgba(139, 92, 246, 0.4)',
          boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge rounded-pill bg-warning text-dark fw-bold px-3 py-1">
                Google Workspace &amp; Maps Hub
              </span>
              <span
                className="badge rounded-pill font-mono-num"
                style={{
                  background: 'rgba(52, 211, 153, 0.2)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  color: '#6ee7b7',
                }}
              >
                <UserCheck size={12} className="me-1" />
                Intern: Vindhyashree S (VLRINT202601730)
              </span>
            </div>
            <h1 className="h3 fw-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Gmail Integration &amp; Interactive Google Maps Explorer
            </h1>
            <p className="text-secondary small m-0">
              Manage your streak reward emails via Gmail API and explore verified global milestone partner hubs with Google Maps Advanced Markers.
            </p>
          </div>

          {!user || needsAuth ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="btn btn-light fw-bold px-4 py-2 rounded-3 d-inline-flex align-items-center gap-2 shadow-sm"
              style={{ background: '#ffffff', color: '#1f2937' }}
            >
              {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} className="text-danger" />}
              <span>Sign in with Google (Gmail &amp; Maps)</span>
            </button>
          ) : (
            <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-50 px-3 py-2 rounded-3 border border-purple-subtle">
              <div className="d-flex align-items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" width={32} height={32} className="rounded-circle" />
                ) : (
                  <ShieldCheck size={20} className="text-success" />
                )}
                <div>
                  <div className="small fw-bold text-white">{user.displayName || user.email}</div>
                  <div className="text-success" style={{ fontSize: '0.72rem' }}>Authenticated with Gmail &amp; Maps</div>
                </div>
              </div>
              <button
                onClick={() => {
                  auth.signOut();
                  setUser(null);
                  setAccessToken(null);
                  setNeedsAuth(true);
                }}
                className="btn btn-sm btn-outline-danger py-1 px-2"
                style={{ fontSize: '0.75rem' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {needsAuth ? (
        <div
          className="p-5 text-center rounded-4 mb-4"
          style={{
            background: 'rgba(25, 15, 50, 0.9)',
            border: '1px dashed rgba(139, 92, 246, 0.4)',
          }}
        >
          <Mail size={48} className="text-warning mb-3" />
          <h2 className="h4 fw-bold text-white mb-2">Google Authentication Required</h2>
          <p className="text-secondary small max-w-md mx-auto mb-4">
            Please sign in with your Google account to authorize Gmail message sync and interactive Google Maps location services.
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="btn btn-warning fw-bold px-4 py-2 text-dark rounded-3 d-inline-flex align-items-center gap-2"
            style={{ background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)' }}
          >
            {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>Authorize Google Account</span>
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left Column: Gmail Inbox & Email Sender */}
          <div className="col-lg-6">
            <div
              className="p-4 rounded-4 h-100 d-flex flex-column gap-4"
              style={{
                background: 'rgba(19, 12, 38, 0.92)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              {/* Section A: Compose / Send Email */}
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Send size={18} className="text-warning" />
                  <h2 className="h6 fw-bold text-white m-0">Send Reward Milestone Email via Gmail</h2>
                </div>

                {emailStatus && (
                  <div
                    className={`p-3 rounded-3 mb-3 small d-flex align-items-center gap-2 ${
                      emailStatus.success ? 'bg-success bg-opacity-25 text-success border border-success' : 'bg-danger bg-opacity-25 text-danger border border-danger'
                    }`}
                  >
                    {emailStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{emailStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleSendEmail} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label text-secondary small fw-semibold">Recipient Email Address</label>
                    <input
                      type="email"
                      required
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="recipient@example.com"
                      className="form-control bg-dark text-light border-purple"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label className="form-label text-secondary small fw-semibold">Email Subject</label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="form-control bg-dark text-light border-purple"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label className="form-label text-secondary small fw-semibold">Message Body</label>
                    <textarea
                      rows={3}
                      required
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="form-control bg-dark text-light border-purple"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="btn btn-warning fw-bold text-dark rounded-3 py-2 d-inline-flex align-items-center justify-content-center gap-2"
                    style={{ background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)' }}
                  >
                    {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>{sendingEmail ? 'Sending via Gmail API...' : 'Send Email'}</span>
                  </button>
                </form>
              </div>

              {/* Section B: Recent Gmail Messages */}
              <div className="border-top border-purple pt-3 mt-auto">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Inbox size={18} className="text-info" />
                    <h2 className="h6 fw-bold text-white m-0">Recent Gmail Inbox Messages</h2>
                  </div>
                  <button
                    onClick={() => accessToken && fetchGmailMessages(accessToken)}
                    disabled={loadingMessages}
                    className="btn btn-sm btn-outline-info py-0 px-2"
                    style={{ fontSize: '0.74rem' }}
                  >
                    {loadingMessages ? 'Syncing...' : 'Refresh Inbox'}
                  </button>
                </div>

                {loadingMessages ? (
                  <div className="text-center py-4 text-secondary small">
                    <Loader2 size={20} className="animate-spin mb-2" />
                    <div>Loading messages from Gmail API...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-4 text-secondary small">No recent messages found in inbox.</div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-3 bg-dark bg-opacity-70 border border-purple-subtle small"
                      >
                        <div className="fw-bold text-warning mb-1">{m.subject}</div>
                        <div className="text-secondary" style={{ fontSize: '0.76rem' }}>{m.snippet}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Google Maps Explorer */}
          <div className="col-lg-6">
            <div
              className="p-4 rounded-4 h-100 d-flex flex-column gap-3"
              style={{
                background: 'rgba(19, 12, 38, 0.92)',
                border: '1.5px solid rgba(139, 92, 246, 0.35)',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={18} className="text-danger" />
                  <h2 className="h6 fw-bold text-white m-0">Interactive Google Maps Milestone Hubs</h2>
                </div>
                <span className="badge bg-purple text-light font-mono-num" style={{ fontSize: '0.72rem' }}>
                  {selectedLocation.name}
                </span>
              </div>

              <p className="text-secondary small m-0">
                Click any partner hub marker below to inspect global rewards centers powered by Google Maps Advanced Markers.
              </p>

              {/* Hub Selection Buttons */}
              <div className="d-flex flex-wrap gap-2">
                {partnerHubs.map((hub) => (
                  <button
                    key={hub.name}
                    onClick={() => setSelectedLocation(hub)}
                    className={`btn btn-sm ${
                      selectedLocation.name === hub.name ? 'btn-warning text-dark fw-bold' : 'btn-outline-light text-light'
                    }`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    {hub.name.split(' ')[0]} {hub.name.split(' ')[1]}
                  </button>
                ))}
              </div>

              {/* Map Container */}
              <div
                className="rounded-4 overflow-hidden position-relative flex-grow-1"
                style={{ minHeight: 380, border: '1px solid rgba(139, 92, 246, 0.4)' }}
              >
                <APIProvider apiKey={mapsApiKey}>
                  <Map
                    defaultCenter={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    defaultZoom={12}
                    center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {partnerHubs.map((hub) => (
                      <AdvancedMarker
                        key={hub.name}
                        position={{ lat: hub.lat, lng: hub.lng }}
                        onClick={() => setSelectedLocation(hub)}
                      >
                        <Pin
                          background={selectedLocation.name === hub.name ? '#f59e0b' : '#8b5cf6'}
                          glyphColor="#ffffff"
                          borderColor="#ffffff"
                        />
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              </div>

              <div className="p-2 rounded-3 bg-dark bg-opacity-70 border border-purple-subtle small text-light">
                <strong className="text-warning">{selectedLocation.name}:</strong> {selectedLocation.description} (Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Compliance & Cost Appendix (Required by Google Maps Skill Section 9) */}
      <div
        className="mt-4 p-3 rounded-4 small text-secondary"
        style={{
          background: 'rgba(15, 10, 30, 0.85)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          fontSize: '0.76rem',
        }}
      >
        <div className="fw-bold text-white mb-1">Google Maps Platform Compliance &amp; Terms Notice</div>
        <ul className="mb-0 ps-3">
          <li>
            <strong>Cost Notice:</strong> Usage of Google Maps Platform products and services may incur costs against your Google Cloud project billing account.
          </li>
          <li>
            <strong>Products Used:</strong> Maps JavaScript API, Places API (New), AdvancedMarkerElement.
          </li>
          <li>
            <strong>API Key Security:</strong> Restrict your key (limiting to HTTP referrers and designated APIs) via{' '}
            <a
              href="https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warning text-decoration-underline"
            >
              Google Cloud API Key Restrictions
            </a>.
          </li>
          <li>
            <strong>License Scope &amp; ToS:</strong> Google-sourced code snippets are provided &apos;as-is&apos; under the Apache 2.0 License. Use of this code is subject to the{' '}
            <a
              href="https://cloud.google.com/maps-platform/terms?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warning text-decoration-underline"
            >
              Google Maps Platform Terms of Service
            </a>.
          </li>
        </ul>
      </div>
    </div>
  );
}
