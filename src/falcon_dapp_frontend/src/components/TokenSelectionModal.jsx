import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Wallet } from 'lucide-react';

const TokenSelectionModal = ({ isOpen, onClose, tokens, onSelectToken, title = "Select Token" }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;
    
    const query = searchQuery.toLowerCase();
    return tokens.filter(token => 
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.canisterId.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  const handleSelectToken = (token) => {
    onSelectToken(token);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
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
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-purple-500/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or symbol..."
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Token List */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-2">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 border border-purple-500/30 mb-4">
                  <Search className="w-8 h-8 text-purple-400/60" />
                </div>
                <p className="text-purple-300/70">No tokens found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredTokens.map((token) => (
                <motion.button
                  key={token.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSelectToken(token)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/50 transition-all group"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                    {token.logo ? (
                      <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                    ) : (
                      <Wallet className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-purple-100 group-hover:text-white transition-colors">
                        {token.symbol}
                      </span>
                      {token.isCustom && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-purple-400/70 mt-0.5">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-100 group-hover:text-white transition-colors">
                      {token.balanceFormatted}
                    </div>
                    <div className="text-xs text-purple-400/70">{token.symbol}</div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TokenSelectionModal;
