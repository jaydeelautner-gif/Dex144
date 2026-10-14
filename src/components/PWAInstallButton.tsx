import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  Tablet,
  Share2,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { DeviceAccessModal } from './DeviceAccessModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isIPad, install } = usePWAInstall();
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Direct PWA Install prompt on Desktop Chrome/Edge or Android */}
        {isInstallable && (
          <button
            type="button"
            onClick={install}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Install WebApp</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* View on other devices / Save guidance button */}
        <button
          type="button"
          onClick={() => setShowDeviceModal(true)}
          title="Open on phone, computer, or iPad with QR code"
          className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 text-xs font-semibold text-sky-300 transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <Laptop className="w-3.5 h-3.5 hidden sm:inline" />
          <span className="hidden md:inline">Other Devices</span>
          <span className="md:hidden">Devices</span>
        </button>
      </div>

      {/* Cross-Device Modal with QR Code and guides */}
      <DeviceAccessModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
      />
    </>
  );
};
