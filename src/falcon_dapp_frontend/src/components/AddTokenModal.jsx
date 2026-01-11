import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTokenMetadata } from '../icp/icrc';

const AddTokenModal = ({ isOpen, onClose, onTokenAdded, userPrincipal }) => {
  const [canisterId, setCanisterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleValidate = async () => {
    if (!canisterId.trim()) {
      setError('Please enter a canister ID');
      return;
    }

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const metadata = await getTokenMetadata(canisterId.trim());
      
      if (!metadata) {
        setError('Invalid canister ID or not an ICRC-1 token');
        setLoading(false);
        return;
      }

      setPreview(metadata);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch token metadata');
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (preview) {
      onTokenAdded(canisterId.trim(), preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setCanisterId('');
    setError('');
    setPreview(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-gradient-to-br from-purple-950/90 to-black/90 backdrop-blur-2xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Add Custom Token</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Canister ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Canister ID
              </label>
              <input
                type="text"
                value={canisterId}
                onChange={(e) => setCanisterId(e.target.value)}
                placeholder="ryjl3-tyaaa-aaaaa-aaaba-cai"
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-400">
                Enter the ICRC-1 token ledger canister ID
              </p>
            </div>

            {/* Validate Button */}
            {!preview && (
              <button
                onClick={handleValidate}
                disabled={loading || !canisterId.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate Token'
                )}
              </button>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Token Preview */}
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Token Validated</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Name:</span>
                    <span className="text-white font-medium">{preview.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Symbol:</span>
                    <span className="text-purple-400 font-bold">{preview.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Decimals:</span>
                    <span className="text-white">{preview.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Transfer Fee:</span>
                    <span className="text-white">{preview.fee / Math.pow(10, preview.decimals)} {preview.symbol}</span>
                  </div>
                </div>

                {/* Add Token Button */}
                <button
                  onClick={handleAdd}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Token to Wallet
                </button>
              </motion.div>
            )}
          </div>

          {/* Info Footer */}
          <div className="px-6 py-4 bg-black/30 border-t border-purple-500/20">
            <p className="text-xs text-gray-400 text-center">
              Only ICRC-1 compatible tokens can be added. Make sure you trust the token before adding it.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddTokenModal;
