import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { transferToken, formatTokenAmount, parseTokenAmount, getTokenBalance } from '../icp/icrc';

const SendModal = ({ isOpen, onClose, token, userPrincipal }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0n);

  useEffect(() => {
    if (isOpen && token && userPrincipal) {
      // Fetch current balance
      getTokenBalance(token.canisterId, userPrincipal).then(setUserBalance);
    }
  }, [isOpen, token, userPrincipal]);

  const handleSend = async () => {
    setError('');
    
    // Validation
    if (!recipient.trim()) {
      setError('Please enter recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter valid amount');
      return;
    }

    try {
      const amountInUnits = parseTokenAmount(amount, token.decimals);
      const totalWithFee = amountInUnits + BigInt(token.fee);

      // Check if user has enough balance
      if (userBalance < totalWithFee) {
        setError(`Insufficient balance. You need ${formatTokenAmount(totalWithFee, token.decimals)} ${token.symbol} (including fee)`);
        return;
      }

      setLoading(true);

      // Perform transfer
      const result = await transferToken(
        token.canisterId,
        recipient.trim(),
        amountInUnits,
        userPrincipal
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(`Transfer failed: ${result.error}`);
      }
    } catch (err) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setError('');
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  const handleMaxAmount = () => {
    const maxSendable = userBalance - BigInt(token.fee);
    if (maxSendable > 0n) {
      setAmount(formatTokenAmount(maxSendable, token.decimals));
    }
  };

  if (!isOpen || !token) return null;

  const feeFormatted = formatTokenAmount(token.fee, token.decimals);
  const balanceFormatted = formatTokenAmount(userBalance, token.decimals);

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
                <Send className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Send {token.symbol}</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Balance: {balanceFormatted} {token.symbol}
                </p>
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
          <div className="p-6 space-y-4">
            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter principal ID"
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                disabled={loading || success}
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Amount
                </label>
                <button
                  onClick={handleMaxAmount}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  disabled={loading || success}
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors pr-20"
                  disabled={loading || success}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                  {token.symbol}
                </span>
              </div>
            </div>

            {/* Fee Info */}
            <div className="p-4 bg-black/30 border border-purple-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Network Fee:</span>
                <span className="text-white font-medium">{feeFormatted} {token.symbol}</span>
              </div>
              {amount && parseFloat(amount) > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-purple-500/20">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-purple-400 font-bold">
                    {(parseFloat(amount) + parseFloat(feeFormatted)).toFixed(token.decimals)} {token.symbol}
                  </span>
                </div>
              )}
            </div>

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

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-green-400 font-medium">Transfer Successful!</p>
                <p className="text-sm text-gray-400 mt-1">Transaction completed</p>
              </motion.div>
            )}

            {/* Send Button */}
            {!success && (
              <button
                onClick={handleSend}
                disabled={loading || !recipient || !amount}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send {token.symbol}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Warning Footer */}
          <div className="px-6 py-4 bg-black/30 border-t border-purple-500/20">
            <p className="text-xs text-gray-400 text-center">
              ⚠️ Double-check the recipient address. Transactions cannot be reversed.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendModal;
