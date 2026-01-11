import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, AlertCircle, ExternalLink, CreditCard } from 'lucide-react';

const TransakBuyModal = ({ isOpen, onClose, userAddress, defaultCurrency = 'ICP' }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [loading, setLoading] = useState(false);

  // Transak configuration
  const TRANSAK_API_KEY = process.env.TRANSAK_API_KEY || 'YOUR_TRANSAK_API_KEY'; // Replace with your key
  const TRANSAK_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING';

  const supportedCurrencies = [
    { symbol: 'ICP', name: 'Internet Computer', network: 'ICP' },
    { symbol: 'BTC', name: 'Bitcoin', network: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', network: 'ethereum' },
    { symbol: 'USDT', name: 'Tether (ERC-20)', network: 'ethereum' },
  ];

  const handleBuy = () => {
    setLoading(true);

    // Build Transak URL with parameters
    const transakUrl = new URL('https://global.transak.com');
    
    const params = {
      apiKey: TRANSAK_API_KEY,
      environment: TRANSAK_ENVIRONMENT,
      defaultCryptoCurrency: currency,
      walletAddress: userAddress,
      networks: supportedCurrencies.find(c => c.symbol === currency)?.network || 'ICP',
      disableWalletAddressForm: true,
      hideMenu: true,
      themeColor: '9333ea', // Purple theme
    };

    // Add amount if specified
    if (amount && parseFloat(amount) > 0) {
      params.defaultCryptoAmount = amount;
    }

    // Append params to URL
    Object.entries(params).forEach(([key, value]) => {
      transakUrl.searchParams.append(key, value);
    });

    // Open Transak widget in new window
    const transakWindow = window.open(
      transakUrl.toString(),
      'Transak Widget',
      'width=500,height=700,resizable=yes,scrollbars=yes'
    );

    // Listen for Transak events (optional)
    const handleMessage = (event) => {
      // Verify origin
      if (event.origin !== 'https://global.transak.com') return;

      const { event_id, data } = event.data;

      switch (event_id) {
        case 'TRANSAK_ORDER_SUCCESSFUL':
          console.log('Order successful:', data);
          // Handle successful purchase
          break;
        case 'TRANSAK_ORDER_FAILED':
          console.log('Order failed:', data);
          break;
        case 'TRANSAK_WIDGET_CLOSE':
          transakWindow?.close();
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup
    const checkWindow = setInterval(() => {
      if (transakWindow?.closed) {
        clearInterval(checkWindow);
        window.removeEventListener('message', handleMessage);
        setLoading(false);
        onClose();
      }
    }, 500);
  };

  const handleClose = () => {
    setAmount('');
    setCurrency(defaultCurrency);
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
                <ShoppingCart className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Buy Crypto</h2>
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
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                {supportedCurrencies.map(curr => (
                  <option key={curr.symbol} value={curr.symbol}>
                    {curr.symbol} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (Optional)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                step="any"
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Wallet Address Display */}
            <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-xl">
              <div className="text-xs text-gray-400 mb-1">Receiving Address:</div>
              <div className="font-mono text-sm text-purple-200 break-all">
                {userAddress}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-purple-300 mb-1">Powered by Transak</p>
                  <p className="text-xs">Buy crypto with credit/debit card or bank transfer. Fast, secure, and compliant.</p>
                </div>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Continue to Transak
                </>
              )}
            </button>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-black/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                You will be redirected to Transak to complete your purchase. Transak is a third-party service. Please review their terms and conditions.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-black/30 border-t border-purple-500/20">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <a 
                href="https://transak.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-purple-400 transition-colors"
              >
                About Transak
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a 
                href="https://transak.com/terms-of-service" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-purple-400 transition-colors"
              >
                Terms of Service
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransakBuyModal;
