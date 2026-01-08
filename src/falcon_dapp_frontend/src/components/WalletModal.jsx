import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, Zap, Globe, Link as LinkIcon, X, ArrowRight, Download } from 'lucide-react';
import { useWallet } from '../wallet/WalletProvider';

function OptionCard({ title, subtitle, Icon, onClick, disabled, notInstalled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-md transition hover:border-purple-400/25 hover:bg-white/10 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Icon className="h-6 w-6 text-purple-200" />
          </div>
          <div>
            <div className="text-base font-semibold text-white flex items-center gap-2">
              {title}
              {notInstalled && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Missing</span>}
            </div>
            <div className="mt-1 text-sm text-gray-400">
              {notInstalled ? 'Click to install extension' : subtitle}
            </div>
          </div>
        </div>
        {notInstalled ? (
          <Download className="h-5 w-5 text-orange-400 opacity-70" />
        ) : (
          <ArrowRight className="h-5 w-5 text-white/50 transition group-hover:translate-x-1 group-hover:text-white" />
        )}
      </div>
    </button>
  );
}

export default function WalletModal({ open, onClose }) {
  const {
    connectMetaMask, connectPhantom, connectTronLink,
    isMetaMaskAvailable, isPhantomAvailable, isTronLinkAvailable,
    error, status, isAuthenticated
  } = useWallet();

  // Backend login başarılıysa otomatik kapat
  React.useEffect(() => {
    if (isAuthenticated) onClose();
  }, [isAuthenticated, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center p-4" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            className="relative z-[10000] w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            <div className="relative w-full rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet className="text-purple-400" /> Connect Wallet
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition">
                  <X className="text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {error}
                </div>
              )}

              <div className="grid gap-3">
                <OptionCard
                  title="MetaMask"
                  subtitle="Ethereum, BSC, Polygon"
                  Icon={Zap}
                  onClick={connectMetaMask}
                  notInstalled={!isMetaMaskAvailable}
                  disabled={status === 'connecting'}
                />
                <OptionCard
                  title="Phantom"
                  subtitle="Solana Network"
                  Icon={Globe}
                  onClick={connectPhantom}
                  notInstalled={!isPhantomAvailable}
                  disabled={status === 'connecting'}
                />
                <OptionCard
                  title="TronLink"
                  subtitle="Tron Network"
                  Icon={LinkIcon}
                  onClick={connectTronLink}
                  notInstalled={!isTronLinkAvailable}
                  disabled={status === 'connecting'}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}