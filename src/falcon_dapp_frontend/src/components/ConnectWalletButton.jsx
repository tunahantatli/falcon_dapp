import React from 'react';
import { Zap } from 'lucide-react';
import { useWallet } from '../wallet/WalletProvider';

export default function ConnectWalletButton() {
  const { status, shortAddress, connect } = useWallet();

  const label =
    status === 'connecting'
      ? 'Connecting…'
      : status === 'connected'
        ? shortAddress
        : 'Connect Wallet';

  return (
    <button
      type="button"
      onClick={connect}
      className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:border-cyan-300/40 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] focus-visible:ring-2 focus-visible:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-70"
      aria-label="Connect Wallet"
      disabled={status === 'connecting'}
    >
      <span className="relative">
        <span className="absolute -inset-1 rounded-lg bg-cyan-400/10 opacity-0 blur-md transition group-hover:opacity-100" />
        <span className="relative">{label}</span>
      </span>
      <Zap className="h-4 w-4 text-cyan-300 transition group-hover:text-cyan-200" />
    </button>
  );
}
