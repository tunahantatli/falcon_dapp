import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, Zap, Globe, Link, X, ArrowRight } from 'lucide-react';

function OptionCard({ title, subtitle, Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-md transition hover:border-purple-400/25 hover:bg-white/10"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Icon className="h-6 w-6 text-purple-200" />
          </div>
          <div>
            <div className="text-base font-semibold text-white">{title}</div>
            <div className="mt-1 text-sm text-gray-400">{subtitle}</div>
          </div>
        </div>

        <ArrowRight className="h-5 w-5 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
      </div>
    </button>
  );
}

export default function WalletModal({
  open,
  onClose,
  onSelectEvm,
  onSelectSolana,
  onSelectTron,
  errorMessage,
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="relative z-[61] flex h-full w-full items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-modal="true"
            aria-label="Connect Wallet"
          >
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(168,85,247,0.16)] backdrop-blur-md max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-h-[calc(100vh-3rem)]">
              <div className="pointer-events-none absolute -inset-10 bg-gradient-to-r from-purple-500/18 via-fuchsia-500/10 to-pink-500/10 blur-2xl" aria-hidden="true" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/80">
                      <Wallet className="h-4 w-4 text-purple-200" />
                      Wallet
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold text-white">Connect Wallet</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      Choose your ecosystem to continue.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/** Optional: if parent passes an error message, show it */}
                {typeof errorMessage === 'string' && errorMessage.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-sm text-orange-200">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-3">
                  <OptionCard
                    title="EVM Chains"
                    subtitle="Supports MetaMask, Trust Wallet, Rabby."
                    Icon={Zap}
                    onClick={onSelectEvm}
                  />
                  <OptionCard
                    title="Solana"
                    subtitle="Supports Phantom."
                    Icon={Globe}
                    onClick={onSelectSolana}
                  />
                  <OptionCard
                    title="Tron"
                    subtitle="Supports TronLink."
                    Icon={Link}
                    onClick={onSelectTron}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
