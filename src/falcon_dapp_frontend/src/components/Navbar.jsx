import React from 'react';
import { Globe, Link, LogOut, Zap } from 'lucide-react';
import Container from './Container';

function formatAddress(address) {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function WalletTypeBadge({ walletType }) {
  if (!walletType) return null;

  const config =
    walletType === 'evm'
      ? { label: 'ETH', Icon: Zap, className: 'border-purple-400/25 bg-purple-500/10 text-purple-100' }
      : walletType === 'solana'
        ? { label: 'SOL', Icon: Globe, className: 'border-white/15 bg-white/5 text-white/85' }
        : { label: 'TRX', Icon: Link, className: 'border-white/15 bg-white/5 text-white/85' };

  return (
    <div
      className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex ${config.className}`}
    >
      <config.Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}

export default function Navbar({
  walletAddress,
  walletType,
  onOpenConnect,
  onDisconnect,
}) {
  const buttonLabel = walletAddress ? formatAddress(walletAddress) : 'Connect Wallet';
  const buttonClass = walletAddress
    ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/25 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 shadow-[0_0_28px_rgba(168,85,247,0.15)] backdrop-blur-md transition hover:bg-purple-500/15 focus-visible:ring-2 focus-visible:ring-purple-300/40'
    : 'group inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:border-cyan-300/40 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] focus-visible:ring-2 focus-visible:ring-cyan-300/50';

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-white/10 bg-[#0a0a0a]/60 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Falcon Logo" className="h-10 w-auto" />
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Pricing
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <WalletTypeBadge walletType={walletType} />

                <button
                  type="button"
                  onClick={onOpenConnect}
                  className={buttonClass}
                  aria-label="Connect Wallet"
                  disabled={false}
                >
                  {buttonLabel}
                </button>

                {walletAddress ? (
                  <button
                    type="button"
                    onClick={onDisconnect}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
                    aria-label="Disconnect"
                    title="Disconnect"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
