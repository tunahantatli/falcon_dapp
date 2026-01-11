import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Wallet, TrendingUp, Clock, Send, Download, Plus, Trash2, ShoppingCart, Repeat, Search, Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Container from './Container';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';
import AddTokenModal from './AddTokenModal';
import TokenSelectionModal from './TokenSelectionModal';
import TransactionHistory from './TransactionHistory';
import TransakBuyModal from './TransakBuyModal';
import { DEFAULT_TOKENS, getAllBalances, formatTokenAmount, getRecentTransactions, getTokenMetadata } from '../icp/icrc';
import { fetchTokenPrices, formatUSDPrice, formatPriceChange } from '../icp/priceApi';
import { 
  getCustomTokens, 
  addCustomToken, 
  removeCustomToken, 
  getHiddenTokens, 
  saveHiddenTokens,
  migrateLocalStorageToBackend 
} from '../icp/preferences';
import { falcon_dapp_backend } from '../../../declarations/falcon_dapp_backend';

export default function WalletPage({ address, onBack }) {
  const [copied, setCopied] = useState(false);
  const [customTokens, setCustomTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenTokens, setHiddenTokens] = useState([]);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  
  // Modal states
  const [tokenSelectionModal, setTokenSelectionModal] = useState({ isOpen: false, action: null });
  const [sendModal, setSendModal] = useState({ isOpen: false, token: null });
  const [receiveModal, setReceiveModal] = useState({ isOpen: false, token: null });
  const [addTokenModal, setAddTokenModal] = useState(false);
  const [transactionHistoryModal, setTransactionHistoryModal] = useState(false);
  const [transakBuyModal, setTransakBuyModal] = useState(false);

  // Load custom tokens and hidden tokens from backend (not localStorage)
  useEffect(() => {
    const loadPreferences = async () => {
      if (!address) return;
      
      setIsLoadingPrefs(true);
      try {
        // Migrate localStorage to backend if exists
        await migrateLocalStorageToBackend(address);
        
        // Load from backend
        const [customTokensData, hiddenTokensData] = await Promise.all([
          getCustomTokens(address),
          getHiddenTokens(address)
        ]);
        
        // Transform backend custom tokens to frontend format
        const transformedTokens = customTokensData.map(token => ({
          id: token.id,
          canisterId: token.canisterId,
          name: token.name,
          symbol: token.symbol,
          decimals: Number(token.decimals),
          logo: null,
          isCustom: true,
          fee: 0, // Will be fetched when needed
        }));
        
        setCustomTokens(transformedTokens);
        setHiddenTokens(hiddenTokensData);
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoadingPrefs(false);
      }
    };
    
    loadPreferences();
  }, [address]);

  // SWR fetcher function
  const fetchBalances = useCallback(async () => {
    if (!address) return null;
    
    try {
      const balances = await getAllBalances(address, customTokens);
      return balances;
    } catch (error) {
      console.error('Error fetching balances:', error);
      return [];
    }
  }, [address, customTokens]);

  // Use SWR for silent background fetching
  const { data: tokens = [], isLoading: loading, mutate } = useSWR(
    address ? `balances-${address}` : null,
    fetchBalances,
    {
      refreshInterval: 10000, // Poll every 10 seconds silently
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Fetch real-time prices from CoinGecko
  const { data: prices = {} } = useSWR(
    'token-prices',
    () => fetchTokenPrices(['icp', 'ckbtc', 'cketh', 'ckusdt']),
    {
      refreshInterval: 60000, // Update every 1 minute
      revalidateOnFocus: true,
    }
  );

  // Fetch recent transactions from backend cache (fallback to ICRC-3)
  const { data: recentTxs = [] } = useSWR(
    address ? `recent-txs-${address}` : null,
    async () => {
      try {
        // Try backend first
        const backendTxs = await falcon_dapp_backend.getRecentTransactions(address, 5);
        
        if (backendTxs.length > 0) {
          // Transform backend transactions to frontend format
          return backendTxs.map(tx => ({
            id: tx.id,
            timestamp: Number(tx.timestamp) / 1_000_000, // Convert nanoseconds to milliseconds
            from: tx.from,
            to: tx.to,
            amount: Number(tx.amount),
            tokenSymbol: tx.tokenSymbol,
            type: tx.txType,
            tokenId: tx.tokenSymbol.toLowerCase(),
            tokenDecimals: 8, // Default decimals
          }));
        }
        
        // Fallback to ICRC-3 if backend has no transactions
        if (tokens.length > 0) {
          return await getRecentTransactions(address, tokens.slice(0, 4), 5);
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
        // Fallback to ICRC-3
        if (tokens.length > 0) {
          try {
            return await getRecentTransactions(address, tokens.slice(0, 4), 5);
          } catch (fallbackError) {
            console.error('ICRC-3 fallback also failed:', fallbackError);
            return [];
          }
        }
        return [];
      }
    },
    {
      refreshInterval: 30000, // Update every 30 seconds
      revalidateOnFocus: true,
    }
  );

  // Calculate total USD value with real prices
  const totalBalanceUSD = useMemo(() => {
    return tokens.reduce((sum, token) => {
      const price = prices[token.id]?.usd || 0;
      const balance = Number(token.balance) / Math.pow(10, token.decimals);
      return sum + (balance * price);
    }, 0);
  }, [tokens, prices]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return addr;
  };

  // Filter and sort tokens
  const visibleTokens = useMemo(() => {
    let filtered = tokens.filter(token => !hiddenTokens.includes(token.id));
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query)
      );
    }
    
    // Sort: tokens with balance > 0 first, then by balance descending
    return filtered.sort((a, b) => {
      const balanceA = Number(a.balance);
      const balanceB = Number(b.balance);
      
      if (balanceA === 0 && balanceB === 0) return 0;
      if (balanceA === 0) return 1;
      if (balanceB === 0) return -1;
      return balanceB - balanceA;
    });
  }, [tokens, hiddenTokens, searchQuery]);

  const handleAddToken = async (canisterId, metadata) => {
    try {
      // Add to backend
      const success = await addCustomToken(
        address,
        canisterId,
        metadata.name,
        metadata.symbol,
        metadata.decimals
      );
      
      if (success) {
        // Create frontend token object
        const newToken = {
          id: `${metadata.symbol}-${canisterId}`,
          canisterId,
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          logo: null,
          isCustom: true,
          fee: metadata.fee || 0,
        };
        
        setCustomTokens([...customTokens, newToken]);
        mutate(); // Trigger SWR refresh
      }
    } catch (error) {
      console.error('Error adding token:', error);
    }
  };

  const handleRemoveToken = async (canisterId) => {
    try {
      await removeCustomToken(address, canisterId);
      setCustomTokens(customTokens.filter(t => t.canisterId !== canisterId));
      mutate();
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  const handleToggleTokenVisibility = async (tokenId) => {
    const newHidden = hiddenTokens.includes(tokenId)
      ? hiddenTokens.filter(id => id !== tokenId)
      : [...hiddenTokens, tokenId];
    
    setHiddenTokens(newHidden);
    
    // Save to backend instead of localStorage
    try {
      await saveHiddenTokens(address, newHidden);
    } catch (error) {
      console.error('Error saving hidden tokens:', error);
    }
  };

  const handleActionClick = (action) => {
    setTokenSelectionModal({ isOpen: true, action });
  };

  const handleTokenSelect = (token) => {
    const { action } = tokenSelectionModal;
    if (action === 'send') {
      setSendModal({ isOpen: true, token });
    } else if (action === 'receive') {
      setReceiveModal({ isOpen: true, token });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] pt-24 sm:pt-28 pb-16 overflow-hidden">
      {/* Cyber-noir Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-purple-950/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      <Container>
        {/* Back Button */}
        <button
          onClick={onBack}
          className="relative mb-6 inline-flex items-center gap-2 text-sm text-purple-300/70 hover:text-purple-200 transition-all group"
        >
          <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 rounded-lg blur-sm transition-all" />
          <ArrowLeft className="relative h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="relative">Back to Dashboard</span>
        </button>

        {/* Header with Glow */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 blur-2xl opacity-30" />
          <div className="relative">
            <div className="text-xs font-semibold tracking-[0.24em] text-purple-400/80">
              FALCON WALLET
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-200 bg-clip-text text-transparent sm:text-4xl">
              Your ICP Wallet
            </h1>
          </div>
        </div>

        <div className="relative grid gap-6 lg:grid-cols-3">
          {/* Main Wallet Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Card - Glassmorphism */}
            <div className="group relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-black/40 to-purple-950/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all hover:shadow-[0_0_50px_rgba(168,85,247,0.25)] hover:border-purple-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="text-xs font-semibold tracking-wider text-purple-400/90 mb-2">
                    WALLET ADDRESS
                  </div>
                  <div className="font-mono text-sm text-purple-100/90 break-all leading-relaxed">
                    {formatAddress(address)}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="relative flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-500/30 bg-purple-950/50 hover:bg-purple-900/50 transition-all text-sm text-purple-200 hover:text-purple-100 shadow-lg hover:shadow-purple-500/25 backdrop-blur-xl group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover/btn:opacity-100 rounded-xl transition-opacity" />
                  {copied ? (
                    <>
                      <Check className="relative h-4 w-4 text-emerald-400" />
                      <span className="relative">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="relative h-4 w-4" />
                      <span className="relative">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Balance Card - Featured Glassmorphism */}
            <div className="relative group rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/30 via-fuchsia-950/20 to-purple-900/30 p-10 backdrop-blur-2xl text-center shadow-[0_0_60px_rgba(168,85,247,0.2)] transition-all hover:shadow-[0_0_80px_rgba(168,85,247,0.35)] hover:border-purple-400/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-colors" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl group-hover:bg-fuchsia-400/30 transition-colors" />
              
              <div className="relative">
                <div className="text-xs font-semibold tracking-wider text-purple-400/90 mb-3">
                  TOTAL BALANCE
                </div>
                <motion.div 
                  key={tokens.find(t => t.id === 'icp')?.balanceFormatted}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl font-bold bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-3"
                >
                  {loading ? '...' : tokens.find(t => t.id === 'icp')?.balanceFormatted || '0.00'} ICP
                </motion.div>
                <motion.div 
                  key={totalBalanceUSD}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-purple-300/70 text-lg"
                >
                  ≈ ${totalBalanceUSD.toFixed(2)} USD
                </motion.div>
              </div>
            </div>

            {/* Global Action Buttons */}
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleActionClick('receive')}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-purple-900/30 hover:from-purple-900/60 hover:to-purple-800/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <Download className="relative h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" />
                <span className="relative text-sm font-medium text-purple-200 group-hover:text-white transition-colors">
                  Receive
                </span>
              </button>

              <button
                onClick={() => handleActionClick('send')}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-purple-900/30 hover:from-purple-900/60 hover:to-purple-800/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <Send className="relative h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" />
                <span className="relative text-sm font-medium text-purple-200 group-hover:text-white transition-colors">
                  Send
                </span>
              </button>

              <button
                onClick={() => setTransakBuyModal(true)}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-purple-900/30 hover:from-purple-900/60 hover:to-purple-800/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <ShoppingCart className="relative h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" />
                <span className="relative text-sm font-medium text-purple-200 group-hover:text-white transition-colors">
                    Buy
                </span>
              </button>

              <button
                onClick={() => alert('Swap feature coming soon!')}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-purple-900/30 hover:from-purple-900/60 hover:to-purple-800/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                <Repeat className="relative h-6 w-6 text-purple-300 group-hover:text-purple-200 transition-colors" />
                <span className="relative text-sm font-medium text-purple-200 group-hover:text-white transition-colors">
                  Swap
                </span>
              </button>
            </div>

            {/* Tokens List - Glassmorphism */}
            <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-black/40 to-purple-950/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl" />
              <div className="relative flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-200">Your Tokens</h2>
                <button
                  onClick={() => setAddTokenModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs text-purple-300 hover:text-purple-200 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Token
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-purple-500/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>
              
              {loading ? (
                <div className="relative text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-950/50 border border-purple-500/30 mb-4">
                    <Wallet className="h-10 w-10 text-purple-400/60 animate-pulse" />
                  </div>
                  <div className="text-purple-300/70 font-medium">Loading tokens...</div>
                </div>
              ) : visibleTokens.length === 0 ? (
                <div className="relative text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-950/50 border border-purple-500/30 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    {searchQuery ? (
                      <Search className="h-10 w-10 text-purple-400/60" />
                    ) : (
                      <Wallet className="h-10 w-10 text-purple-400/60" />
                    )}
                  </div>
                  <div className="text-purple-300/70 font-medium">
                    {searchQuery ? 'No tokens found' : 'No tokens yet'}
                  </div>
                  <div className="text-sm mt-2 text-purple-400/50">
                    {searchQuery ? 'Try a different search term' : 'Your tokens will appear here'}
                  </div>
                </div>
              ) : (
                <div className="relative space-y-3">
                  {visibleTokens.map((token) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/50 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30">
                          {token.logo ? (
                            <img src={token.logo} alt={token.symbol} className="w-6 h-6" />
                          ) : (
                            <Wallet className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-purple-100">{token.symbol}</div>
                            {token.isCustom && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-purple-400/70 truncate">{token.name}</div>
                        </div>
                        <div className="text-right">
                          <motion.div 
                            key={token.balanceFormatted}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-sm font-medium text-purple-100"
                          >
                            {token.balanceFormatted} {token.symbol}
                          </motion.div>
                          {prices[token.id] ? (
                            <div className="text-xs text-purple-400/70">
                              {formatUSDPrice(prices[token.id].usd)} • 
                              <span className={formatPriceChange(prices[token.id].usd_24h_change).color}>
                                {formatPriceChange(prices[token.id].usd_24h_change).text}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-purple-400/70">
                              Fee: {formatTokenAmount(token.fee, token.decimals)} {token.symbol}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleTokenVisibility(token.id)}
                          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition-all"
                          title={hiddenTokens.includes(token.id) ? "Show Token" : "Hide Token"}
                        >
                          {hiddenTokens.includes(token.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        {token.isCustom && (
                          <button
                            onClick={() => handleRemoveToken(token.canisterId)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 hover:text-red-200 transition-all"
                            title="Remove Token"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Cyber-noir Cards */}
          <div className="space-y-6">
            {/* Quick Stats - Glassmorphism */}
            <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-black/40 to-purple-950/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
              <h3 className="relative text-sm font-semibold text-purple-200 mb-5 tracking-wide">
                Quick Stats
              </h3>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/50 transition-all group">
                  <div className="flex items-center gap-3 text-sm text-purple-300/80 group-hover:text-purple-200 transition-colors">
                    <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <Wallet className="h-4 w-4 text-purple-400" />
                    </div>
                    Total Assets
                  </div>
                  <div className="text-sm font-semibold text-purple-100">{tokens.length}</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/50 transition-all group">
                  <div className="flex items-center gap-3 text-sm text-purple-300/80 group-hover:text-purple-200 transition-colors">
                    <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>
                    24h Change
                  </div>
                  <div className="text-sm font-semibold text-purple-100">0%</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-950/50 transition-all group">
                  <div className="flex items-center gap-3 text-sm text-purple-300/80 group-hover:text-purple-200 transition-colors">
                    <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <Clock className="h-4 w-4 text-purple-400" />
                    </div>
                    Transactions
                  </div>
                  <div className="text-sm font-semibold text-purple-100">0</div>
                </div>
              </div>
            </div>

            {/* Recent Activity - Glassmorphism */}
            <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-black/40 to-purple-950/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] overflow-hidden">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-purple-200 tracking-wide">
                  Recent Activity
                </h3>
                <button
                  onClick={() => setTransactionHistoryModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View All
                </button>
              </div>
              {recentTxs.length === 0 ? (
                <div className="relative text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 border border-purple-500/30 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <Clock className="h-7 w-7 text-purple-400/60" />
                  </div>
                  <div className="text-purple-300/70 text-sm">
                    No recent activity
                  </div>
                </div>
              ) : (
                <div className="relative space-y-3">
                  {recentTxs.slice(0, 5).map((tx, index) => (
                    <motion.div
                      key={`${tx.tokenId}-${tx.id}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-purple-950/30 border border-purple-500/10 hover:border-purple-500/20 transition-all group cursor-pointer"
                      onClick={() => setTransactionHistoryModal(true)}
                    >
                      <div className={`p-2 rounded-lg ${tx.type === 'send' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                        {tx.type === 'send' ? (
                          <ArrowUpRight className="w-3 h-3 text-red-400" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-green-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-purple-100 capitalize">
                          {tx.type} {tx.tokenSymbol}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className={`text-xs font-medium ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'send' ? '-' : '+'}
                        {formatTokenAmount(tx.amount, tx.tokenDecimals)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Modals */}
      <TokenSelectionModal
        isOpen={tokenSelectionModal.isOpen}
        onClose={() => setTokenSelectionModal({ isOpen: false, action: null })}
        tokens={tokens}
        onSelectToken={handleTokenSelect}
        title={tokenSelectionModal.action === 'send' ? 'Gönderilecek Token Seç' : 'Alınacak Token Seç'}
      />
      <SendModal
        isOpen={sendModal.isOpen}
        onClose={() => setSendModal({ isOpen: false, token: null })}
        token={sendModal.token}
        userPrincipal={address}
      />
      <ReceiveModal
        isOpen={receiveModal.isOpen}
        onClose={() => setReceiveModal({ isOpen: false, token: null })}
        token={receiveModal.token}
        userPrincipal={address}
      />
      <AddTokenModal
        isOpen={addTokenModal}
        onClose={() => setAddTokenModal(false)}
        onTokenAdded={handleAddToken}
        userPrincipal={address}
      />
      <TransactionHistory
        isOpen={transactionHistoryModal}
        onClose={() => setTransactionHistoryModal(false)}
        userPrincipal={address}
        tokens={tokens}
      />
      <TransakBuyModal
        isOpen={transakBuyModal}
        onClose={() => setTransakBuyModal(false)}
        userAddress={address}
        defaultCurrency="ICP"
      />
    </div>
  );
}