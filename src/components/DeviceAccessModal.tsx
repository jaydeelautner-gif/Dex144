import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Tablet,
  QrCode,
  Copy,
  Check,
  Share,
  PlusSquare,
  Download,
  WifiOff,
  Cloud,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface DeviceAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceAccessModal: React.FC<DeviceAccessModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isIPad, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'computer' | 'phone' | 'ipad'>('phone');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://homedex.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0F1522] border border-amber-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase">
              MULTI-DEVICE ACCESS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            View HomeDex on Phone, Computer & iPad
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            HomeDex works seamlessly in any web browser and can be saved to your home screen or
            installed as a desktop webapp with full offline support.
          </p>
        </div>

        {/* QR Code & Share URL Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0B0F17] border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-32 bg-white rounded-xl p-1.5 shrink-0 shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src={qrCodeUrl}
              alt="Scan to open HomeDex on your phone"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col gap-2 w-full text-center sm:text-left">
            <div>
              <span className="text-xs font-bold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                Scan with Phone Camera
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Point your iPhone or Android camera at the QR code to open HomeDex instantly.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Device Selection Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'phone'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('computer')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'computer'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Computer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ipad')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ipad'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>iPad / Tablet</span>
          </button>
        </div>

        {/* Tab Content 1: Phone */}
        {activeTab === 'phone' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-400" />
                iPhone / iOS (Safari)
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>
                  Open HomeDex in <strong>Safari</strong> on your phone.
                </li>
                <li>
                  Tap the <Share className="inline w-3 h-3 text-sky-400" /> <strong>Share</strong>{' '}
                  icon in the bottom menu bar.
                </li>
                <li>
                  Scroll down and tap{' '}
                  <PlusSquare className="inline w-3 h-3 text-emerald-400" />{' '}
                  <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> in the top-right corner. It will now launch like a native
                  app with standalone offline storage!
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Android Phone (Chrome)
              </span>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>
                  Open HomeDex in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.
                </li>
                <li>
                  Tap the top-right <strong>three-dots menu</strong> (⋮).
                </li>
                <li>
                  Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab Content 2: Computer */}
        {activeTab === 'computer' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-amber-400" />
                Web Browser on PC / Mac / Chromebook
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                HomeDex runs directly in any modern desktop browser (Chrome, Edge, Safari, Firefox,
                Brave). You get full access to all 35 Living Boxes, specimen inventory, and
                keyboard shortcuts.
              </p>

              {isInstallable && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Install HomeDex Desktop App</span>
                  </button>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                💡 <strong>Desktop Shortcut Tip:</strong> In Chrome or Edge, click the{' '}
                <strong>Install App</strong> icon in the address bar (or Menu → Save and Share →
                Install) to launch HomeDex in its own dedicated desktop window!
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: iPad / Tablet */}
        {activeTab === 'ipad' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Tablet className="w-4 h-4 text-sky-400" />
                iPad & Tablet Saved WebApp Storage
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                On iPad, tap Safari's <Share className="inline w-3 h-3 text-sky-400" /> Share button
                at the top toolbar, then tap <strong>Add to Home Screen</strong>.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                ✓ Once installed on iPad, go to <strong>Settings → Offline Mode</strong> to lock
                storage persistence and download all 1,025 Pokémon sprites directly to your iPad!
              </div>
            </div>
          </div>
        )}

        {/* Multi-Device Cloud Sync explanation */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <Cloud className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Sync Across All Devices:</strong> Sign in with the same email & password on your
            computer, phone, and iPad to synchronize all your caught Pokémon and Living Boxes!
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
