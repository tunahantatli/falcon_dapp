import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getDepositAddress } from '../icp/icrc';

const ReceiveModal = ({ isOpen, onClose, token, userPrincipal }) => {
  const [depositAddress, setDepositAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && token && userPrincipal) {
      loadDepositAddress();
    }
  }, [isOpen, token, userPrincipal]);

  const loadDepositAddress = async () => {
    setLoading(true);
    setError('');
    
    try {
      // For cross-chain tokens (ckBTC, ckETH, ckUSDT)
      if (token.depositInfo) {
        const address = await getDepositAddress(token.id, userPrincipal);
        if (address) {
          setDepositAddress(address);
        } else {
          setError('Could not generate deposit address');
        }
      } else {
        // For native ICP tokens, use user's principal
        setDepositAddress(userPrincipal);
      }
    } catch (err) {
      setError(err.message || 'Failed to load deposit address');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (depositAddress) {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setDepositAddress(null);
    setError('');
    setCopied(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !token) return null;

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
                <Download className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Receive {token.symbol}</h2>
                {token.depositInfo && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    From {token.depositInfo.chain}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                <p className="text-gray-400">Generating deposit address...</p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300">{error}</p>
                  <button
                    onClick={loadDepositAddress}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : depositAddress ? (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-2xl shadow-lg">
                    <QRCodeSVG
                      value={depositAddress}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Address Display */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {token.depositInfo ? 'Deposit Address' : 'Your Wallet Address'}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white text-sm break-all">
                      {depositAddress}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-all"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-green-400 text-center"
                    >
                      ✓ Address copied!
                    </motion.p>
                  )}
                </div>

                {/* Instructions */}
                {token.depositInfo ? (
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-xl space-y-2">
                    <h3 className="text-sm font-medium text-purple-400">How to Deposit:</h3>
                    <p className="text-xs text-gray-300">{token.depositInfo.instruction}</p>
                    <div className="pt-2 mt-2 border-t border-purple-500/20">
                      <p className="text-xs text-gray-400">
                        ⏱️ Processing time: 10-60 minutes depending on network confirmation
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-xl">
                    <p className="text-xs text-gray-300 text-center">
                      Send {token.symbol} from any ICP wallet to this address
                    </p>
                  </div>
                )}

                {/* Network Info */}
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl text-xs">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white font-medium">
                    {token.depositInfo?.chain || 'Internet Computer'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Warning Footer */}
          <div className="px-6 py-4 bg-black/30 border-t border-purple-500/20">
            <p className="text-xs text-gray-400 text-center">
              ⚠️ Only send {token.symbol} to this address. Sending other tokens may result in permanent loss.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiveModal;
