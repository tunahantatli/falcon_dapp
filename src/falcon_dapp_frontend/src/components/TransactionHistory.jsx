import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownLeft, Clock, ExternalLink, Filter, Calendar } from 'lucide-react';
import { getTransactionHistory, formatTransaction } from '../icp/icrc';
import { falcon_dapp_backend } from '../../../declarations/falcon_dapp_backend';

const TransactionHistory = ({ isOpen, onClose, userPrincipal, tokens }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [useBackend, setUseBackend] = useState(true);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (isOpen && userPrincipal && tokens.length > 0) {
      loadTransactions();
    }
  }, [isOpen, userPrincipal, tokens, selectedToken, page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Try backend first
      if (useBackend && page === 0) {
        try {
          const backendTxs = await falcon_dapp_backend.getUserTransactions(userPrincipal);
          
          if (backendTxs.length > 0) {
            // Transform backend transactions
            const transformedTxs = backendTxs.map(tx => {
              const token = tokens.find(t => t.symbol === tx.tokenSymbol) || tokens[0];
              return {
                id: tx.id,
                timestamp: Number(tx.timestamp) / 1_000_000, // Convert nanoseconds to milliseconds
                from: tx.from,
                to: tx.to,
                amount: Number(tx.amount),
                tokenSymbol: tx.tokenSymbol,
                tokenDecimals: token?.decimals || 8,
                tokenLogo: token?.logo || null,
                tokenId: tx.tokenSymbol.toLowerCase(),
                type: tx.txType,
              };
            });

            setTransactions(transformedTxs);
            setHasMore(false); // Backend returns all transactions
            setLoading(false);
            return;
          }
        } catch (backendError) {
          console.warn('Backend transactions not available, falling back to ICRC-3:', backendError);
          setUseBackend(false);
        }
      }

      // Fallback to ICRC-3
      const tokensToFetch = selectedToken === 'all' 
        ? tokens 
        : tokens.filter(t => t.id === selectedToken);

      let allTxs = [];
      
      for (const token of tokensToFetch) {
        const txs = await getTransactionHistory(
          token.canisterId, 
          userPrincipal, 
          page * ITEMS_PER_PAGE, 
          ITEMS_PER_PAGE
        );
        
        const txsWithToken = txs.map(tx => ({
          ...tx,
          tokenSymbol: token.symbol,
          tokenDecimals: token.decimals,
          tokenLogo: token.logo,
          tokenId: token.id,
        }));

        allTxs.push(...txsWithToken);
      }

      // Sort by timestamp
      allTxs.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(allTxs);
      setHasMore(allTxs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (selectedType === 'all') return true;
    return tx.type === selectedType;
  });

  const handleClose = () => {
    setPage(0);
    setSelectedToken('all');
    setSelectedType('all');
    onClose();
  };

  const getTransactionIcon = (type) => {
    return type === 'send' ? (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    ) : (
      <ArrowDownLeft className="w-4 h-4 text-green-400" />
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-purple-950/90 to-black/90 backdrop-blur-2xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-purple-500/10 bg-black/20">
            <div className="flex flex-wrap gap-3">
              {/* Token Filter */}
              <select
                value={selectedToken}
                onChange={(e) => { setSelectedToken(e.target.value); setPage(0); }}
                className="px-4 py-2 bg-purple-950/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="all">All Tokens</option>
                {tokens.map(token => (
                  <option key={token.id} value={token.id}>{token.symbol}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-purple-950/50 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="send">Sent</option>
                <option value="receive">Received</option>
              </select>

              <div className="ml-auto text-sm text-gray-400 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {filteredTransactions.length} transactions
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 border border-purple-500/30 mb-4">
                  <Clock className="w-8 h-8 text-purple-400/60 animate-pulse" />
                </div>
                <p className="text-purple-300/70">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 border border-purple-500/30 mb-4">
                  <Clock className="w-8 h-8 text-purple-400/60" />
                </div>
                <p className="text-purple-300/70 font-medium">No transactions found</p>
                <p className="text-sm text-gray-400 mt-2">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => {
                  const formatted = formatTransaction(tx);
                  return (
                    <motion.div
                      key={`${tx.tokenId}-${tx.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/50 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex-shrink-0">
                          {tx.tokenLogo ? (
                            <img src={tx.tokenLogo} alt={tx.tokenSymbol} className="w-6 h-6 rounded-full" />
                          ) : (
                            getTransactionIcon(tx.type)
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium capitalize">{tx.type}</span>
                                <span className="text-purple-400 text-sm">{tx.tokenSymbol}</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {formatted.dateFormatted} at {formatted.timeFormatted}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                                {tx.type === 'send' ? '-' : '+'}{formatted.amountFormatted}
                              </div>
                              <div className={`text-xs ${getStatusColor(tx.status)} capitalize`}>
                                {tx.status}
                              </div>
                            </div>
                          </div>

                          {/* Addresses */}
                          <div className="text-xs text-gray-400 space-y-1 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">From:</span>
                              <span className="font-mono">{tx.from === userPrincipal ? 'You' : `${tx.from.slice(0, 8)}...${tx.from.slice(-6)}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">To:</span>
                              <span className="font-mono">{tx.to === userPrincipal ? 'You' : `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Hash:</span>
                              <span className="font-mono">{formatted.shortHash}</span>
                              <button 
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                                onClick={() => window.open(`https://dashboard.internetcomputer.org/transaction/${tx.hash}`, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-purple-500/10 bg-black/20 flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:text-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:text-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionHistory;
