import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { useWallet } from '../wallet/WalletProvider';

export default function WalletModal({ open, onClose }) {
  const {
    connectII,
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
                  <Shield className="text-purple-400" /> Connect Falcon Wallet
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

              <button
                type="button"
                onClick={connectII}
                disabled={status === 'connecting'}
                className="group w-full rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6 text-left backdrop-blur-md transition hover:border-purple-400/50 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-500/15">
                    <Shield className="h-8 w-8 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-white mb-1">
                      Falcon Wallet
                    </div>
                    <div className="text-sm text-gray-400">
                      Powered by Internet Identity
                    </div>
                    <div className="mt-2 text-xs text-purple-300">
                      Secure • No Extensions • Web3-Native
                    </div>
                  </div>
                </div>
              </button>
              
              <p className="mt-4 text-center text-xs text-gray-500">
                Your ICP-native wallet • FaceID, TouchID or PIN authentication
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}