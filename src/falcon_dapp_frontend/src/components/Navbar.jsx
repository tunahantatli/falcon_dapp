import React from 'react';
import { ethers } from 'ethers';
import { Globe, Link, LogOut, Zap } from 'lucide-react';
import Container from './Container';
import WalletModal from './WalletModal';

const LS_WALLET_TYPE = 'falcon.walletType';
const LS_WALLET_ADDRESS = 'falcon.walletAddress';

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

export default function Navbar() {
  const [walletAddress, setWalletAddress] = React.useState(null);
  const [walletType, setWalletType] = React.useState(null); // 'evm' | 'solana' | 'tron'
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [connectError, setConnectError] = React.useState(null);

  const isEvmAvailable = typeof window !== 'undefined' && !!window.ethereum;
  const solanaProvider =
    typeof window !== 'undefined' ? (window.phantom?.solana || window.solana) : null;
  const isSolanaAvailable = !!solanaProvider;
  const isTronAvailable = typeof window !== 'undefined' && (!!window.tronLink || !!window.tronWeb);

  const disconnect = React.useCallback(() => {
    setWalletAddress(null);
    setWalletType(null);
    setConnectError(null);
    try {
      localStorage.removeItem(LS_WALLET_TYPE);
      localStorage.removeItem(LS_WALLET_ADDRESS);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    // Restore previous selection/address best-effort
    try {
      const storedType = localStorage.getItem(LS_WALLET_TYPE);
      const storedAddress = localStorage.getItem(LS_WALLET_ADDRESS);
      if (storedType && storedAddress) {
        setWalletType(storedType);
        setWalletAddress(storedAddress);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    // EVM listeners: update address on account change, without page reload
    if (!isEvmAvailable) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
        return;
      }
      // Only auto-update if we are currently using EVM wallet type
      setWalletAddress((prev) => {
        const next = accounts[0];
        try {
          if (walletType === 'evm') localStorage.setItem(LS_WALLET_ADDRESS, next);
        } catch {
          // ignore
        }
        return next;
      });
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [isEvmAvailable, disconnect, walletType]);

  const connectEvm = React.useCallback(async () => {
    setConnectError(null);
    if (!isEvmAvailable) {
      const msg = 'MetaMask Wallet not found!';
      setConnectError(msg);
      alert(msg);
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setWalletType('evm');
      try {
        localStorage.setItem(LS_WALLET_TYPE, 'evm');
        localStorage.setItem(LS_WALLET_ADDRESS, address);
      } catch {
        // ignore
      }
      setIsModalOpen(false);
    } catch (e) {
      const msg = e?.shortMessage || e?.message || 'EVM wallet connection failed.';
      setConnectError(msg);
      alert(msg);
    }
  }, [isEvmAvailable]);

  const connectSolana = React.useCallback(async () => {
    setConnectError(null);
    if (!solanaProvider) {
      const msg = 'Phantom Wallet not found!';
      setConnectError(msg);
      alert(msg);
      return;
    }
    try {
      setConnectError('Opening Phantom…');
      if (typeof solanaProvider.connect !== 'function') {
        const msg = 'Phantom Wallet not found!';
        setConnectError(msg);
        alert(msg);
        return;
      }

      const resp = await solanaProvider.connect();
      const pubkey = resp?.publicKey?.toString?.() || solanaProvider?.publicKey?.toString?.();
      if (!pubkey) {
        const msg = 'Solana wallet connected but address not available.';
        setConnectError(msg);
        alert(msg);
        return;
      }
      setWalletAddress(pubkey);
      setWalletType('solana');
      try {
        localStorage.setItem(LS_WALLET_TYPE, 'solana');
        localStorage.setItem(LS_WALLET_ADDRESS, pubkey);
      } catch {
        // ignore
      }
      setIsModalOpen(false);
    } catch (e) {
      const msg = e?.message || 'Solana wallet connection failed.';
      setConnectError(msg);
      alert(msg);
    }
  }, [solanaProvider]);

  const connectTron = React.useCallback(async () => {
    setConnectError(null);
    if (!isTronAvailable) {
      const msg = 'TronLink Wallet not found!';
      setConnectError(msg);
      alert(msg);
      return;
    }

    // TronLink typically exposes request() on window.tronLink, and tronWeb for address.
    const tronRequest = window.tronLink?.request || window.tronWeb?.request;
    if (!tronRequest) {
      const msg = 'TronLink Wallet not found!';
      setConnectError(msg);
      alert(msg);
      return;
    }

    try {
      await tronRequest({ method: 'tron_requestAccounts' });
      const address = window.tronWeb?.defaultAddress?.base58;
      if (!address) {
        const msg = 'Tron wallet connected but address not available.';
        setConnectError(msg);
        alert(msg);
        return;
      }
      setWalletAddress(address);
      setWalletType('tron');
      try {
        localStorage.setItem(LS_WALLET_TYPE, 'tron');
        localStorage.setItem(LS_WALLET_ADDRESS, address);
      } catch {
        // ignore
      }
      setIsModalOpen(false);
    } catch (e) {
      const msg = e?.message || 'Tron wallet connection failed.';
      setConnectError(msg);
      alert(msg);
    }
  }, [isTronAvailable]);

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
                  onClick={() => {
                    setConnectError(null);
                    setIsModalOpen(true);
                  }}
                  className={buttonClass}
                  aria-label="Connect Wallet"
                  disabled={false}
                >
                  {buttonLabel}
                </button>

                {walletAddress ? (
                  <button
                    type="button"
                    onClick={disconnect}
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

      <WalletModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectEvm={connectEvm}
        onSelectSolana={connectSolana}
        onSelectTron={connectTron}
        errorMessage={connectError}
      />
    </div>
  );
}
