import React, { useEffect, useRef, useState } from 'react';
import {
  Share2,
  Download,
  Sparkles,
  Send,
  Copy,
  CheckCircle2,
  Type,
  Palette,
} from 'lucide-react';
import {
  VERSE_CARD_THEMES,
  VerseCardTheme,
  wrapVerseTextIntoLines,
} from '../lib/domainLogic';

export interface HighlightedVerseChoice {
  key: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleVerseShareCardProps {
  highlightedVerses: HighlightedVerseChoice[];
  activeVerse: HighlightedVerseChoice;
  onSelectVerse: (verse: HighlightedVerseChoice) => void;
  onShareToFeed: (dataUrl: string, verse: HighlightedVerseChoice, caption: string) => void;
  onShareToStory: (dataUrl: string, verse: HighlightedVerseChoice) => void;
  onToast: (message: string) => void;
}

export const BibleVerseShareCard: React.FC<BibleVerseShareCardProps> = ({
  highlightedVerses,
  activeVerse,
  onSelectVerse,
  onShareToFeed,
  onShareToStory,
  onToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<VerseCardTheme>(VERSE_CARD_THEMES[0]);
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>('serif');
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [shareCaption, setShareCaption] = useState<string>(
    `Meditating on ${activeVerse.reference} today 🙌✨ #GatewayConnect #WordOfGod`
  );

  // Sync default share caption when user switches highlighted verse
  useEffect(() => {
    setShareCaption(
      `Meditating on ${activeVerse.reference} today 🙌✨ #GatewayConnect #WordOfGod`
    );
  }, [activeVerse.reference]);

  // Render high-resolution verse image onto HTML5 Canvas whenever verse, theme, or font changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1080;

    // 1. Rich multi-stop diagonal gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, selectedTheme.gradientStops[0]);
    bgGrad.addColorStop(0.52, selectedTheme.gradientStops[1]);
    bgGrad.addColorStop(1, selectedTheme.gradientStops[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient radial glow in top-right and bottom-left
    const radialGlow = ctx.createRadialGradient(width * 0.8, height * 0.2, 40, width * 0.8, height * 0.2, 540);
    radialGlow.addColorStop(0, `${selectedTheme.accentColor}44`);
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    const bottomGlow = ctx.createRadialGradient(width * 0.2, height * 0.85, 30, width * 0.2, height * 0.85, 480);
    bottomGlow.addColorStop(0, `${selectedTheme.accentColor}33`);
    bottomGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Outer Sanctuary Frame Border
    ctx.strokeStyle = `${selectedTheme.accentColor}55`;
    ctx.lineWidth = 4;
    ctx.strokeRect(56, 56, width - 112, height - 112);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2;
    ctx.strokeRect(74, 74, width - 148, height - 148);

    // 4. Top Ministry Header Pill
    ctx.fillStyle = 'rgba(11, 15, 25, 0.45)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 250, 118, 500, 58, 29);
    ctx.fill();
    ctx.strokeStyle = `${selectedTheme.accentColor}66`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = selectedTheme.accentColor;
    ctx.font = '800 24px "Plus Jakarta Sans", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ GATEWAY CONNECT • KJV SCRIPTURE ✦', width / 2, 155);

    // 5. Large Decorative Opening Quote Mark
    ctx.fillStyle = `${selectedTheme.accentColor}38`;
    ctx.font = '900 180px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('“', width / 2, 330);

    // 6. Wrapped Scripture Verse Lines
    const wrappedLines = wrapVerseTextIntoLines(`“${activeVerse.text}”`, 32);
    const fontSize = wrappedLines.length > 6 ? 40 : wrappedLines.length > 4 ? 46 : 52;
    const lineHeight = Math.round(fontSize * 1.42);
    const fontFamily =
      fontStyle === 'serif'
        ? `italic 700 ${fontSize}px Georgia, "Times New Roman", serif`
        : `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;

    ctx.font = fontFamily;
    ctx.fillStyle = selectedTheme.textColor;
    ctx.textAlign = 'center';

    const totalTextHeight = wrappedLines.length * lineHeight;
    const startY = Math.max(360, (height - totalTextHeight) / 2 + 20);

    wrappedLines.forEach((line, index) => {
      ctx.fillText(line, width / 2, startY + index * lineHeight);
    });

    // 7. Accent Divider Line
    const dividerY = Math.min(835, startY + totalTextHeight + 36);
    ctx.fillStyle = selectedTheme.accentColor;
    ctx.fillRect(width / 2 - 70, dividerY, 140, 5);

    // 8. Scripture Reference (e.g., PSALMS 23:1 (KJV))
    ctx.fillStyle = selectedTheme.subTextColor;
    ctx.font = '800 36px "Plus Jakarta Sans", "Inter", sans-serif';
    ctx.fillText(`${activeVerse.reference.toUpperCase()} (KJV)`, width / 2, dividerY + 58);

    // 9. Footer Branding Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '600 22px "Plus Jakarta Sans", "Inter", sans-serif';
    ctx.fillText('Gateway Connect Sanctuary • Apostle Joe Daniels Ministries', width / 2, 975);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      setGeneratedDataUrl(dataUrl);
    } catch {
      // Canvas export fallback
    }
  }, [activeVerse, selectedTheme, fontStyle]);

  const handleDownloadImage = () => {
    if (!generatedDataUrl) return;
    const link = document.createElement('a');
    const safeRef = activeVerse.reference.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `gateway-verse-${safeRef}.png`;
    link.href = generatedDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast(`🖼️ Saved ${activeVerse.reference} verse card image to your device!`);
  };

  const handleExternalSocialShare = async (platform: 'native' | 'whatsapp' | 'x' | 'copy') => {
    const shareText = `“${activeVerse.text}” — ${activeVerse.reference} (KJV)\n${shareCaption}`;

    if (platform === 'copy') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      onToast('📋 Verse & caption copied for sharing!');
      return;
    }

    if (platform === 'whatsapp') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      handleDownloadImage();
      onToast('💬 Image downloaded & verse copied for WhatsApp status/chat!');
      return;
    }

    if (platform === 'x') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      handleDownloadImage();
      onToast('🐦 Image downloaded & verse ready to post on X / Instagram!');
      return;
    }

    // Try Web Share API with generated PNG file if supported
    if (navigator.share && generatedDataUrl) {
      try {
        const res = await fetch(generatedDataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'gateway-verse.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${activeVerse.reference} — Gateway Connect`,
            text: shareText,
            files: [file],
          });
          onToast('✨ Shared verse image card!');
          return;
        }
        await navigator.share({
          title: `${activeVerse.reference} — Gateway Connect`,
          text: shareText,
        });
        onToast('✨ Shared verse!');
        return;
      } catch {
        // User cancelled or share blocked in iframe; fallback to image download
      }
    }

    handleDownloadImage();
  };

  return (
    <div
      data-testid="bible-verse-share-card"
      className="rounded-2xl bg-[#131d31] border border-[#0095f6]/40 p-3.5 space-y-3 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0095f6]/20 border border-[#0095f6]/40 flex items-center justify-center text-[#38bdf8]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white">
              🎨 Bible Verse Share Card Studio
            </h2>
            <p className="text-[10px] text-slate-400">
              Pick a highlighted verse, style your artwork & share to Feed or social media
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#0095f6]/20 text-[#38bdf8] text-[10px] font-bold">
          {highlightedVerses.length} Highlighted
        </span>
      </div>

      {/* Highlighted Verses Picker */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          1. Pick a Highlighted Verse:
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {highlightedVerses.map((item) => {
            const isSelected = item.key === activeVerse.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectVerse(item)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#0095f6] text-white shadow-xs'
                    : 'bg-[#0b0f19] text-slate-300 border border-slate-700 hover:border-[#0095f6]'
                }`}
              >
                <span>✨</span>
                <span>{item.reference}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme & Typography Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Palette className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mr-0.5" />
          {VERSE_CARD_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTheme(t)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition border ${
                selectedTheme.id === t.id
                  ? 'bg-[#0095f6] text-white border-[#0095f6]'
                  : 'bg-[#0b0f19] text-slate-300 border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setFontStyle((prev) => (prev === 'serif' ? 'sans' : 'serif'))}
          title="Switch Typography Style"
          className="px-2.5 py-1 rounded-xl bg-[#0b0f19] border border-slate-700 text-[10px] font-bold text-[#38bdf8] flex items-center gap-1 shrink-0"
        >
          <Type className="w-3 h-3" />
          <span>{fontStyle === 'serif' ? 'Serif' : 'Modern'}</span>
        </button>
      </div>

      {/* Live Rendered High-Res Canvas Preview */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700/90 shadow-xl bg-black aspect-square max-h-[300px] mx-auto">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1080}
          data-testid="verse-share-canvas"
          className="w-full h-full object-contain block"
        />
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-xs border border-white/15 text-[9px] font-bold text-white flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>✨ Artwork Ready</span>
        </div>
      </div>

      {/* Custom Feed Caption Input */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-300">
          Caption for App Feed / Social Post:
        </label>
        <input
          type="text"
          value={shareCaption}
          onChange={(e) => setShareCaption(e.target.value)}
          placeholder="Add your reflection or testimony..."
          className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0095f6]"
        />
      </div>

      {/* Primary In-App Share Actions: Share to App Feed & Share to Story */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onShareToFeed(generatedDataUrl, activeVerse, shareCaption)}
          className="min-h-[40px] px-3 rounded-xl bg-[#0095f6] hover:bg-[#1d9bf0] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-[#0095f6]/25 transition"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Share to App Feed</span>
        </button>

        <button
          type="button"
          onClick={() => onShareToStory(generatedDataUrl, activeVerse)}
          className="min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#6366f1] hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Post to Story</span>
        </button>
      </div>

      {/* External Social Media & Device Download Actions */}
      <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-800">
        <button
          type="button"
          onClick={handleDownloadImage}
          className="min-h-[34px] px-2 rounded-xl bg-[#0b0f19] border border-slate-700 hover:border-[#0095f6] text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1 transition"
        >
          <Download className="w-3 h-3 text-[#38bdf8]" />
          <span>Save PNG</span>
        </button>

        <button
          type="button"
          onClick={() => handleExternalSocialShare('whatsapp')}
          className="min-h-[34px] px-2 rounded-xl bg-[#0b0f19] border border-slate-700 hover:border-emerald-500 text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1 transition"
        >
          <span>💬</span>
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => handleExternalSocialShare('x')}
          className="min-h-[34px] px-2 rounded-xl bg-[#0b0f19] border border-slate-700 hover:border-sky-400 text-[10px] font-bold text-sky-400 flex items-center justify-center gap-1 transition"
        >
          <span>📲</span>
          <span>Socials</span>
        </button>

        <button
          type="button"
          onClick={() => handleExternalSocialShare('copy')}
          className="min-h-[34px] px-2 rounded-xl bg-[#0b0f19] border border-slate-700 hover:border-[#0095f6] text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1 transition"
        >
          <Copy className="w-3 h-3 text-[#38bdf8]" />
          <span>Copy</span>
        </button>
      </div>
    </div>
  );
};
