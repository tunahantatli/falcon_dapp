import React from 'react';
import { X, Shield, Wallet } from 'lucide-react';
import { useWallet } from '../wallet/WalletProvider';
import WalletModal from './WalletModal';
import WalletDetailsModal from './WalletDetailsModal';

// Wallet config for Falcon Wallet
const WALLET_CONFIG = {
  ii: {
    label: 'Falcon Wallet',
    icon: Shield,
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-400/30',
  },
};

export default function ConnectWalletButton({ onOpenWallet }) {
  const { status, shortAddress, address, walletType, disconnect } = useWallet();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [walletDetailsOpen, setWalletDetailsOpen] = React.useState(false);

  const isConnected = status === 'connected';
  const config = walletType ? WALLET_CONFIG[walletType] : null;
  const Icon = config?.icon || Shield;

  if (isConnected && config) {
    return (
      <>
        <div className="group relative inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWalletDetailsOpen(true)}
            className={`inline-flex items-center gap-2 rounded-xl border ${config.borderColor} ${config.bgColor} px-4 py-2 backdrop-blur-md transition hover:border-purple-400/50 hover:bg-purple-500/20 cursor-pointer`}
          >
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="text-sm font-semibold text-white">{shortAddress}</span>
            <span className="text-xs text-white/50">({config.label})</span>
          </button>
          
          <button
            type="button"
            onClick={disconnect}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 backdrop-blur-md transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
            aria-label="Disconnect Wallet"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <WalletDetailsModal
          open={walletDetailsOpen}
          onClose={() => setWalletDetailsOpen(false)}
          address={address}
          onExpand={() => {
            if (onOpenWallet) onOpenWallet();
          }}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-md transition hover:border-purple-400/40 hover:bg-white/10 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] focus-visible:ring-2 focus-visible:ring-purple-400/50 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label="Connect Wallet"
        disabled={status === 'connecting'}
      >
        <span className="relative">
          <span className="absolute -inset-1 rounded-lg bg-purple-400/10 opacity-0 blur-md transition group-hover:opacity-100" />
          <span className="relative">
            {status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
          </span>
        </span>
        <Wallet className="h-4 w-4 text-purple-300 transition group-hover:text-purple-200" />
      </button>

      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
