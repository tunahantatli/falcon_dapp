import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Copy, ExternalLink, Wallet, Check } from 'lucide-react';

export default function WalletDetailsModal({ open, onClose, address, onExpand }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-10)}`;
  };

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
            className="relative z-[10000] w-full max-w-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            <div className="relative w-full rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet className="text-purple-400" /> Falcon Wallet
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition"
                >
                  <X className="text-gray-400 h-5 w-5" />
                </button>
              </div>

              {/* Wallet Address */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-white/60 mb-2">
                  WALLET ADDRESS
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-sm text-white/85 break-all">
                      {formatAddress(address)}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Copy className="h-4 w-4 text-white/60" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <div className="mt-2 text-xs text-emerald-300">
                      Address copied to clipboard!
                    </div>
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-white/60 mb-2">
                  BALANCE
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    0.00 ICP
                  </div>
                  <div className="text-sm text-white/50">
                    ≈ $0.00 USD
                  </div>
                </div>
              </div>

              {/* Tokens */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-white/60 mb-2">
                  TOKENS
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="text-white/50 text-sm">
                    No tokens yet
                  </div>
                </div>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => {
                  onClose();
                  onExpand();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-200 backdrop-blur-md transition hover:border-purple-400/50 hover:bg-purple-500/20"
              >
                <ExternalLink className="h-4 w-4" />
                Open Full Wallet View
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
