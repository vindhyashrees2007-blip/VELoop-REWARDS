import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Download,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  ScanEye,
  Share2,
  Sparkles,
  Type,
  Upload,
  Wand2,
} from 'lucide-react';
import { MagicCaptionItem, streakApi } from '../../services/streakApi.ts';

import catCoderUrl from '../../assets/images/meme_template_cat_coder_1790488060038.jpg';
import dogCeoUrl from '../../assets/images/meme_template_dog_ceo_1790488076054.jpg';
import crownPedestalUrl from '../../assets/images/veloop_golden_crown_pedestal_1790488030408.jpg';
import giftCoinsUrl from '../../assets/images/veloop_gift_box_coins_1790488044698.jpg';

interface MemeTemplate {
  id: string;
  title: string;
  category: string;
  url: string;
  defaultTop: string;
  defaultBottom: string;
}

const TRENDING_TEMPLATES: MemeTemplate[] = [
  {
    id: 'tpl-cat-coder',
    title: 'Shocked Cat Developer',
    category: 'Tech & Coding',
    url: catCoderUrl,
    defaultTop: 'WHEN YOU REMEMBER YOUR DAILY STREAK',
    defaultBottom: 'AT 11:59 PM BEFORE THE RESET',
  },
  {
    id: 'tpl-dog-ceo',
    title: 'Executive Dog CEO',
    category: 'Boss Moves',
    url: dogCeoUrl,
    defaultTop: 'DAY 7 VIP REWARD UNLOCKED',
    defaultBottom: 'I AM NOW THE CEO OF CONSISTENCY',
  },
  {
    id: 'tpl-vip-crown',
    title: 'VELoop VIP Crown Flex',
    category: 'VELoop Rewards',
    url: crownPedestalUrl,
    defaultTop: 'POV: YOU NEVER MISS A CHECK-IN',
    defaultBottom: 'ULTIMATE REWARD SECURED',
  },
  {
    id: 'tpl-gift-drop',
    title: 'Mystery Reward Drop',
    category: 'VELoop Rewards',
    url: giftCoinsUrl,
    defaultTop: 'BACKEND VALIDATED MY STREAK',
    defaultBottom: '+30 VEs STRAIGHT TO THE WALLET',
  },
];

export function AiMemeStudio() {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>(TRENDING_TEMPLATES[0].url);
  const [selectedTemplateTitle, setSelectedTemplateTitle] = useState<string>(TRENDING_TEMPLATES[0].title);
  const [topText, setTopText] = useState<string>(TRENDING_TEMPLATES[0].defaultTop);
  const [bottomText, setBottomText] = useState<string>(TRENDING_TEMPLATES[0].defaultBottom);
  const [fontSize, setFontSize] = useState<number>(34);
  const [customTopic, setCustomTopic] = useState<string>('');

  // Magic Captions state (gemini-3.1-pro-preview)
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [magicCaptions, setMagicCaptions] = useState<MagicCaptionItem[]>([]);
  const [captionMeta, setCaptionMeta] = useState<{ imageContext?: string; humorVibe?: string; modelUsed?: string }>({});

  // Deep Image Analysis state (gemini-3.1-pro-preview)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<{
    summary: string;
    detectedElements: string[];
    moodAndTone: string;
    memePotentialScore: string;
    modelUsed?: string;
  } | null>(null);

  // Additional AI Toolkit states
  const [isScoringMeme, setIsScoringMeme] = useState(false);
  const [memeScoreResult, setMemeScoreResult] = useState<{
    humor: number;
    relatability: number;
    visualClarity: number;
    captionPotential: number;
    sharingPotential: number;
    observations: string;
    improvements: string[];
    recommendedStyle: string;
  } | null>(null);

  const [isGeneratingSocialPkg, setIsGeneratingSocialPkg] = useState(false);
  const [socialPackage, setSocialPackage] = useState<{
    title: string;
    caption: string;
    post: string;
    callToAction: string;
    hashtags: string[];
    altText?: string;
  } | null>(null);

  const [copywritingResult, setCopywritingResult] = useState<{
    type: 'titles' | 'hashtags' | 'rewrite' | 'social-post';
    heading: string;
    lines: string[];
  } | null>(null);

  // Image Creation & Editing state (gemini-3.1-flash-image-preview)
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getCurrentImageBase64 = async (): Promise<{ base64: string; mimeType: string }> => {
    if (selectedImageSrc.startsWith('data:')) {
      const match = selectedImageSrc.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64: selectedImageSrc };
      }
    }
    const response = await fetch(selectedImageSrc);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          base64: String(reader.result),
          mimeType: blob.type || 'image/jpeg',
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetWidth = 720;
      const aspect = img.height / img.width || 0.75;
      const targetHeight = Math.round(targetWidth * aspect);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const topGrad = ctx.createLinearGradient(0, 0, 0, targetHeight * 0.28);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, targetWidth, targetHeight * 0.28);

      const botGrad = ctx.createLinearGradient(0, targetHeight * 0.72, 0, targetHeight);
      botGrad.addColorStop(0, 'rgba(0,0,0,0)');
      botGrad.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, targetHeight * 0.72, targetWidth, targetHeight * 0.28);

      const drawMemeLines = (text: string, isTop: boolean) => {
        if (!text.trim()) return;
        ctx.font = `900 ${fontSize}px Outfit, Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#090514';
        ctx.lineWidth = Math.max(4, Math.round(fontSize / 6.5));
        ctx.lineJoin = 'round';

        const words = text.toUpperCase().split(' ');
        const maxWidth = targetWidth - 48;
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = fontSize * 1.18;
        const startY = isTop ? fontSize + 18 : targetHeight - 24 - (lines.length - 1) * lineHeight;

        lines.forEach((line, i) => {
          const y = startY + i * lineHeight;
          ctx.strokeText(line, targetWidth / 2, y);
          ctx.fillText(line, targetWidth / 2, y);
        });
      };

      drawMemeLines(topText, true);
      drawMemeLines(bottomText, false);
    };
    img.src = selectedImageSrc;
  }, [selectedImageSrc, topText, bottomText, fontSize]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(String(reader.result));
      setSelectedTemplateTitle(file.name);
      setStatusMessage({ type: 'info', text: `Loaded "${file.name}". Click "Magic Caption" to analyze with Gemini!` });
    };
    reader.readAsDataURL(file);
  };

  const handleMagicCaptions = async () => {
    setIsGeneratingCaptions(true);
    setStatusMessage(null);
    try {
      const { base64, mimeType } = await getCurrentImageBase64();
      const res = await streakApi.generateMagicCaptions({
        imageBase64: base64,
        mimeType,
        templateTitle: selectedTemplateTitle,
        customTopic,
      });

      if (res.success && Array.isArray(res.captions)) {
        setMagicCaptions(res.captions);
        setCaptionMeta({
          imageContext: res.imageContext,
          humorVibe: res.humorVibe,
          modelUsed: res.modelUsed,
        });
        if (res.captions[0]) {
          setTopText(res.captions[0].topText);
          setBottomText(res.captions[0].bottomText);
        }
        setStatusMessage({
          type: 'info',
          text: 'Generated 5 Magic Captions! Click any suggestion below to overlay it instantly.',
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Could not generate captions.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to contact Gemini Magic Caption endpoint.' });
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const handleAnalyzeImage = async () => {
    setIsAnalyzing(true);
    setStatusMessage(null);
    try {
      const { base64, mimeType } = await getCurrentImageBase64();
      const res = await streakApi.analyzeImage({
        imageBase64: base64,
        mimeType,
      });
      if (res.success && res.analysis) {
        setImageAnalysis({ ...res.analysis, modelUsed: res.modelUsed });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Image analysis failed.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error analyzing image with Gemini.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!imagePrompt.trim()) {
      setStatusMessage({ type: 'error', text: 'Enter a base prompt first so Gemini can enhance it.' });
      return;
    }
    setIsEnhancingPrompt(true);
    setStatusMessage(null);
    try {
      const res = await streakApi.enhancePrompt(imagePrompt);
      if (res.success && res.improvedPrompt) {
        setImagePrompt(res.improvedPrompt);
        setStatusMessage({ type: 'info', text: `Prompt Enhanced: ${res.explanation || ''}` });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Unable to enhance prompt.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error enhancing prompt.' });
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleMemeScore = async () => {
    setIsScoringMeme(true);
    setStatusMessage(null);
    try {
      const { base64, mimeType } = await getCurrentImageBase64();
      const res = await streakApi.analyzeMemeScore(base64, mimeType);
      if (res.success && res.humor !== undefined) {
        setMemeScoreResult(res);
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Unable to score meme.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error running Meme Quality Analyzer.' });
    } finally {
      setIsScoringMeme(false);
    }
  };

  const handleImageToSocialPost = async () => {
    setIsGeneratingSocialPkg(true);
    setStatusMessage(null);
    try {
      const { base64, mimeType } = await getCurrentImageBase64();
      const [pkgRes, altRes] = await Promise.all([
        streakApi.generateImageSocialPackage(base64, mimeType, 'Instagram'),
        streakApi.generateAltText(base64, mimeType),
      ]);
      if (pkgRes.success) {
        setSocialPackage({
          title: pkgRes.title,
          caption: pkgRes.caption,
          post: pkgRes.post,
          callToAction: pkgRes.callToAction,
          hashtags: pkgRes.hashtags || [],
          altText: altRes?.altText,
        });
      } else {
        setStatusMessage({ type: 'error', text: pkgRes.message || 'Unable to create social media package.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to generate social media package.' });
    } finally {
      setIsGeneratingSocialPkg(false);
    }
  };

  const handleGenerateOrEditImage = async () => {
    if (!imagePrompt.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a prompt to create or edit an image.' });
      return;
    }
    setIsGeneratingImage(true);
    setStatusMessage(null);
    try {
      let sourceBase64: string | undefined;
      let mimeType: string | undefined;
      if (imageMode === 'edit') {
        const current = await getCurrentImageBase64();
        sourceBase64 = current.base64;
        mimeType = current.mimeType;
      }

      const res = await streakApi.generateOrEditImage({
        prompt: imagePrompt,
        sourceImageBase64: sourceBase64,
        mimeType,
        mode: imageMode,
      });

      if (res.success && res.imageUrl) {
        setSelectedImageSrc(res.imageUrl);
        setSelectedTemplateTitle(`AI Generated: ${imagePrompt.slice(0, 28)}`);
        setStatusMessage({
          type: 'info',
          text: `Image ${imageMode === 'edit' ? 'edited' : 'created'} with ${res.modelUsed}! Now click "Magic Caption" to generate 5 funny captions.`,
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Could not generate image.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to generate image.' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `veloop-meme-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="container py-4" style={{ maxWidth: 1320 }}>
      {/* Header Banner */}
      <div
        className="p-4 rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(38, 20, 76, 0.95) 0%, rgba(18, 10, 38, 0.98) 100%)',
          border: '1px solid rgba(167, 139, 250, 0.35)',
        }}
      >
        <div>
          <h1 className="h3 fw-bold text-white m-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
            AI Meme & Social Content Studio
          </h1>
          <p className="text-secondary small m-0 mt-1">
            Upload a photo, pick a trending template, or generate images with{' '}
            <code className="text-warning">gemini-3.1-flash-image-preview</code> — then click{' '}
            <strong className="text-warning">Magic Caption</strong> (<code className="text-info">gemini-3.1-pro-preview</code>) for 5 instant captions.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="d-none"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3"
          >
            <Upload size={16} />
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingCaptions}
            onClick={handleMagicCaptions}
            className="btn btn-warning btn-sm fw-bold d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 text-dark"
            style={{
              background: 'linear-gradient(180deg, #fde047 0%, #f59e0b 100%)',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.38)',
            }}
          >
            {isGeneratingCaptions ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            <span>{isGeneratingCaptions ? 'Analyzing Context...' : 'Magic Caption (5 Ideas)'}</span>
          </button>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleAnalyzeImage}
            className="btn btn-info btn-sm fw-semibold d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 text-dark"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ScanEye size={16} />}
            <span>Analyze Image</span>
          </button>

          <button
            type="button"
            disabled={isScoringMeme}
            onClick={handleMemeScore}
            className="btn btn-outline-warning btn-sm fw-semibold d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3"
          >
            {isScoringMeme ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
            <span>Meme Score</span>
          </button>

          <button
            type="button"
            disabled={isGeneratingSocialPkg}
            onClick={handleImageToSocialPost}
            className="btn btn-outline-info btn-sm fw-semibold d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3"
          >
            {isGeneratingSocialPkg ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            <span>Social Package & Alt Text</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className="alert py-2 px-3 mb-4 rounded-3 small fw-medium"
          style={{
            background:
              statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.16)' : 'rgba(139, 92, 246, 0.18)',
            border: `1px solid ${
              statusMessage.type === 'error' ? 'rgba(248, 113, 113, 0.45)' : 'rgba(167, 139, 250, 0.4)'
            }`,
            color: statusMessage.type === 'error' ? '#fecaca' : '#e9d5ff',
          }}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Live Meme Canvas & Template Selector */}
        <div className="col-lg-6">
          <div
            className="p-3 rounded-4 mb-3 text-center"
            style={{
              background: 'rgba(17, 10, 36, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.28)',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2 px-1">
              <span className="small text-secondary fw-semibold">{selectedTemplateTitle}</span>
              <button
                type="button"
                onClick={handleDownloadMeme}
                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 py-1 px-3 rounded-pill"
              >
                <Download size={14} /> Download PNG
              </button>
            </div>

            <div className="overflow-hidden rounded-3 border border-secondary border-opacity-25 bg-black">
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: 'auto', maxHeight: 460, objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>

          {/* Trending Templates Strip */}
          <div
            className="p-3 rounded-4"
            style={{
              background: 'rgba(17, 10, 36, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
            }}
          >
            <div className="small fw-bold text-white mb-2">Trending Templates</div>
            <div className="row g-2">
              {TRENDING_TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="col-6 col-sm-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageSrc(tpl.url);
                      setSelectedTemplateTitle(tpl.title);
                      setTopText(tpl.defaultTop);
                      setBottomText(tpl.defaultBottom);
                    }}
                    className="w-100 p-1 rounded-3 text-start border bg-transparent"
                    style={{
                      borderColor:
                        selectedImageSrc === tpl.url ? '#fbbf24' : 'rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    <img
                      src={tpl.url}
                      alt={tpl.title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '100%',
                        height: 68,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                    />
                    <div className="text-white text-truncate mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      {tpl.title}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Magic Captions + Text Overlay Controls + Gemini Image Create/Edit + AI Insights */}
        <div className="col-lg-6 d-flex flex-column gap-3">
          {/* 1. Magic Captions Panel */}
          <div
            className="p-3 rounded-4"
            style={{
              background: 'rgba(23, 14, 48, 0.94)',
              border: '1px solid rgba(251, 191, 36, 0.38)',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <Sparkles size={18} className="text-warning" />
                <h2 className="h6 fw-bold text-white m-0">Magic Caption Suggestions (Click to Apply)</h2>
              </div>
              {captionMeta.modelUsed && (
                <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                  {captionMeta.modelUsed}
                </span>
              )}
            </div>

            <div className="input-group input-group-sm mb-3">
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder="Optional humor topic (e.g., coding bugs, daily streak grind, Monday mornings)..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
              <button
                type="button"
                disabled={isGeneratingCaptions}
                onClick={handleMagicCaptions}
                className="btn btn-warning fw-bold text-dark"
              >
                {isGeneratingCaptions ? 'Thinking...' : 'Generate 5 Captions'}
              </button>
            </div>

            {captionMeta.imageContext && (
              <div className="small text-secondary mb-2">
                <strong>AI Scene Context:</strong> {captionMeta.imageContext}
              </div>
            )}

            {magicCaptions.length === 0 ? (
              <div className="text-secondary small py-2">
                Click <strong>Magic Caption</strong> to let Gemini analyze the image and suggest 5 funny captions.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {magicCaptions.map((cap, idx) => {
                  const isActive = topText === cap.topText && bottomText === cap.bottomText;
                  return (
                    <button
                      key={cap.id || idx}
                      type="button"
                      onClick={() => {
                        setTopText(cap.topText);
                        setBottomText(cap.bottomText);
                      }}
                      className="text-start p-2 rounded-3 d-flex align-items-center justify-content-between gap-2"
                      style={{
                        background: isActive ? 'rgba(245, 158, 11, 0.22)' : 'rgba(12, 7, 26, 0.75)',
                        border: `1px solid ${isActive ? '#fbbf24' : 'rgba(139, 92, 246, 0.25)'}`,
                        color: '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="small">
                        <span className="text-warning fw-bold me-2">#{idx + 1}</span>
                        <span className="fw-semibold">{cap.topText}</span>
                        <span className="text-secondary mx-1">/</span>
                        <span className="text-info fw-semibold">{cap.bottomText}</span>
                      </div>
                      <span className="text-secondary flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                        {cap.styleTag}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Manual Caption Overlay & Typography Controls */}
          <div
            className="p-3 rounded-4"
            style={{
              background: 'rgba(17, 10, 36, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.28)',
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <Type size={16} className="text-info" />
              <h3 className="h6 fw-bold text-white m-0">Caption Overlay Editor</h3>
            </div>
            <div className="row g-2">
              <div className="col-sm-6">
                <label className="form-label small text-secondary mb-1">Top Text</label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label small text-secondary mb-1">Bottom Text</label>
                <input
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                />
              </div>
              <div className="col-12 mt-2">
                <label className="form-label small text-secondary mb-1 d-flex justify-content-between">
                  <span>Overlay Font Size</span>
                  <span className="font-mono-num text-white">{fontSize}px</span>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min={20}
                  max={52}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* 3. Create & Edit Images with gemini-3.1-flash-image-preview + AI Prompt Enhancer */}
          <div
            className="p-3 rounded-4"
            style={{
              background: 'rgba(17, 10, 36, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.28)',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <ImageIcon size={16} className="text-warning" />
                <h3 className="h6 fw-bold text-white m-0">Create & Edit Images (gemini-3.1-flash-image-preview)</h3>
              </div>
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  onClick={() => setImageMode('create')}
                  className={`btn ${imageMode === 'create' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
                >
                  Create New
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('edit')}
                  className={`btn ${imageMode === 'edit' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
                >
                  Edit Current
                </button>
              </div>
            </div>

            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                placeholder={
                  imageMode === 'create'
                    ? 'Describe a new meme image to generate...'
                    : 'Describe how to edit the current image...'
                }
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              />
              <button
                type="button"
                disabled={isEnhancingPrompt}
                onClick={handleEnhancePrompt}
                className="btn btn-outline-warning"
                title="AI Prompt Enhancer (/api/ai/enhance-prompt)"
              >
                {isEnhancingPrompt ? 'Enhancing...' : 'Enhance Prompt'}
              </button>
              <button
                type="button"
                disabled={isGeneratingImage}
                onClick={handleGenerateOrEditImage}
                className="btn btn-primary fw-semibold"
              >
                {isGeneratingImage ? 'Generating...' : imageMode === 'create' ? 'Generate Image' : 'Apply Edit'}
              </button>
            </div>
          </div>

          {/* 4. Deep Image Understanding Results */}
          {imageAnalysis && (
            <div
              className="p-3 rounded-4"
              style={{
                background: 'rgba(14, 28, 46, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-info small">Gemini Vision Analysis ({imageAnalysis.modelUsed})</span>
                <span className="text-warning small fw-semibold">{imageAnalysis.memePotentialScore}</span>
              </div>
              <p className="small text-light mb-2">{imageAnalysis.summary}</p>
              <div className="small text-secondary">
                <strong>Mood & Tone:</strong> {imageAnalysis.moodAndTone} · <strong>Detected:</strong>{' '}
                {(imageAnalysis.detectedElements || []).join(' · ')}
              </div>
            </div>
          )}

          {/* 5. Meme Quality Score Results (/api/ai/meme-score) */}
          {memeScoreResult && (
            <div
              className="p-3 rounded-4"
              style={{
                background: 'rgba(28, 18, 54, 0.9)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-warning small">AI Meme Quality Scorecard</span>
                <span className="small text-info">{memeScoreResult.recommendedStyle}</span>
              </div>
              <div className="d-flex flex-wrap gap-3 small mb-2 font-mono-num">
                <span>Humor: <strong>{memeScoreResult.humor}/10</strong></span>
                <span>Relatability: <strong>{memeScoreResult.relatability}/10</strong></span>
                <span>Clarity: <strong>{memeScoreResult.visualClarity}/10</strong></span>
                <span>Sharing: <strong>{memeScoreResult.sharingPotential}/10</strong></span>
              </div>
              <p className="small text-light mb-1">{memeScoreResult.observations}</p>
            </div>
          )}

          {/* 6. Social Media Package & Alt-Text Results (/api/ai/image-to-post & /api/ai/alt-text) */}
          {socialPackage && (
            <div
              className="p-3 rounded-4"
              style={{
                background: 'rgba(16, 36, 36, 0.9)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-success small d-inline-flex align-items-center gap-1">
                  <FileText size={14} /> Ready-to-Publish Social Package
                </span>
                <span className="small text-white fw-semibold">{socialPackage.title}</span>
              </div>
              <p className="small text-light mb-2">{socialPackage.post}</p>
              {socialPackage.altText && (
                <div className="small text-info mb-2">
                  <strong>Accessible Alt Text:</strong> {socialPackage.altText}
                </div>
              )}
              <div className="small text-warning d-flex align-items-center gap-1 flex-wrap">
                <Hash size={13} />
                {(socialPackage.hashtags || []).join(' ')}
              </div>
            </div>
          )}

          {/* 7. Quick AI Copywriting & Title Generator (/api/ai/meme-title, /api/ai/social-post, /api/ai/hashtags, /api/ai/rewrite) */}
          <div
            className="p-3 rounded-4"
            style={{
              background: 'rgba(17, 10, 36, 0.92)',
              border: '1px solid rgba(139, 92, 246, 0.28)',
            }}
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="fw-bold text-white small">AI Viral Titles, Social Post, Hashtags & Rewriter</span>
              <div className="d-flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    const topic = customTopic || selectedTemplateTitle || 'daily streak rewards';
                    const res = await streakApi.generateMemeTitles(topic);
                    if (res.success && Array.isArray(res.titles)) {
                      setCopywritingResult({
                        type: 'titles',
                        heading: `10 Viral Meme Titles (${res.modelUsed || 'Gemini AI'})`,
                        lines: res.titles,
                      });
                    }
                  }}
                  className="btn btn-sm btn-outline-info py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                >
                  10 Meme Titles
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const topic = customTopic || selectedTemplateTitle || 'daily streak rewards';
                    const res = await streakApi.generateSocialPost(topic, 'Instagram', 'funny');
                    if (res.success) {
                      setCopywritingResult({
                        type: 'social-post',
                        heading: `AI Social Post (${res.modelUsed || 'Gemini AI'})`,
                        lines: [
                          `Hook: ${res.hook}`,
                          `Post: ${res.post}`,
                          `Caption: ${res.shortCaption}`,
                          `CTA: ${res.callToAction}`,
                          `Hashtags: ${(res.hashtags || []).join(' ')}`,
                        ],
                      });
                    }
                  }}
                  className="btn btn-sm btn-outline-success py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                >
                  Social Post
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const topic = customTopic || selectedTemplateTitle || 'daily streak rewards';
                    const res = await streakApi.generateHashtags(topic, 15);
                    if (res.success && Array.isArray(res.hashtags)) {
                      setCopywritingResult({
                        type: 'hashtags',
                        heading: `15 Trending Hashtags (${res.modelUsed || 'Gemini AI'})`,
                        lines: [res.hashtags.join(' ')],
                      });
                    }
                  }}
                  className="btn btn-sm btn-outline-warning py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                >
                  15 Hashtags
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const textToRewrite = `${topText} — ${bottomText}`;
                    const res = await streakApi.rewriteContent(textToRewrite, 'witty viral punchline');
                    if (res.success) {
                      setCopywritingResult({
                        type: 'rewrite',
                        heading: `Rewritten Content (${res.modelUsed || 'Gemini AI'})`,
                        lines: [
                          `Title: ${res.suggestedTitle}`,
                          `Rewritten: ${res.rewrittenText}`,
                          `Short Punchline: ${res.shortVersion}`,
                        ],
                      });
                    }
                  }}
                  className="btn btn-sm btn-outline-light py-0 px-2"
                  style={{ fontSize: '0.72rem' }}
                >
                  Rewrite Caption
                </button>
              </div>
            </div>

            {copywritingResult ? (
              <div
                className="p-2 rounded-3 mt-2"
                style={{
                  background: 'rgba(10, 6, 22, 0.85)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                }}
              >
                <div className="small fw-bold text-warning mb-1">{copywritingResult.heading}</div>
                <ul className="small text-light mb-0 ps-3">
                  {copywritingResult.lines.map((line, i) => (
                    <li key={i} className="mb-1">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                Click any tool above to run <code>/api/ai/meme-title</code>, <code>/api/ai/social-post</code>,{' '}
                <code>/api/ai/hashtags</code>, or <code>/api/ai/rewrite</code>.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
