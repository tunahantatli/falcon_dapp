import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2, AlertCircle, CheckCircle2, Search, Wallet } from 'lucide-react';
import { getTokenMetadata } from '../icp/icrc';

// 🔥 Popular ICP Tokens Database
const POPULAR_TOKENS = [
  // Chain-Key Tokens
  {
    canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
    name: 'ckBTC',
    symbol: 'ckBTC',
    logo: '₿',
    description: 'Chain-key Bitcoin on ICP',
    category: 'Chain-Key',
  },
  {
    canisterId: 'ss2fx-dyaaa-aaaar-qacoq-cai',
    name: 'ckETH',
    symbol: 'ckETH',
    logo: 'Ξ',
    description: 'Chain-key Ethereum on ICP',
    category: 'Chain-Key',
  },
  {
    canisterId: 'mxzaz-hqaaa-aaaar-qaada-cai',
    name: 'ckUSDT',
    symbol: 'ckUSDT',
    logo: '₮',
    description: 'Chain-key Tether (USDT) on ICP',
    category: 'Stablecoin',
  },
  {
    canisterId: 'cngnf-vqaaa-aaaar-qag4q-cai',
    name: 'ckUSDC',
    symbol: 'ckUSDC',
    logo: '💵',
    description: 'Chain-key USD Coin on ICP',
    category: 'Stablecoin',
  },
  
  // DEX Tokens
  {
    canisterId: 'zfcdd-tqaaa-aaaaq-aaaga-cai',
    name: 'Sonic',
    symbol: 'SNS1',
    logo: '🔊',
    description: 'Sonic DEX - Fast AMM on ICP',
    category: 'DeFi',
  },
  {
    canisterId: 'aanaa-xaaaa-aaaah-aaeiq-cai',
    name: 'ICPSwap',
    symbol: 'ICS',
    logo: '🔄',
    description: 'ICPSwap DEX Token',
    category: 'DeFi',
  },
  
  // Popular SNS Projects
  {
    canisterId: '2ouva-viaaa-aaaaq-aaamq-cai',
    name: 'OpenChat',
    symbol: 'CHAT',
    logo: '💬',
    description: 'Decentralized chat platform',
    category: 'Social',
  },
  {
    canisterId: 'xyo2o-gyaaa-aaaal-qb55a-cai',
    name: 'Kinic',
    symbol: 'KINIC',
    logo: '🔍',
    description: 'Decentralized search engine',
    category: 'Utility',
  },
  {
    canisterId: '6rdgd-kyaaa-aaaaq-aaavq-cai',
    name: 'Hot or Not',
    symbol: 'HOT',
    logo: '🔥',
    description: 'Social entertainment dApp',
    category: 'Social',
  },
  {
    canisterId: 'ddsp7-7iaaa-aaaaq-aacqq-cai',
    name: 'Catalyze',
    symbol: 'CLYZ',
    logo: '⚡',
    description: 'Crowdfunding platform on ICP',
    category: 'DeFi',
  },
  
  // Gaming & NFT
  {
    canisterId: 'q4eej-kyaaa-aaaaa-aaaha-cai',
    name: 'ICPunks',
    symbol: 'ICPUNKS',
    logo: '🎭',
    description: 'NFT collection on ICP',
    category: 'NFT',
  },
  {
    canisterId: 'bzsui-sqaaa-aaaah-qce2a-cai',
    name: 'Yuku',
    symbol: 'YUKU',
    logo: '🎨',
    description: 'NFT marketplace token',
    category: 'NFT',
  },
  
  // Meme Tokens
  {
    canisterId: 'druyg-tyaaa-aaaaq-aactq-cai',
    name: 'ICPuppies',
    symbol: 'ICPUP',
    logo: '🐶',
    description: 'Community meme token',
    category: 'Meme',
  },
  {
    canisterId: 'u45jl-liaaa-aaaam-abppa-cai',
    name: 'BOB',
    symbol: 'BOB',
    logo: '🤖',
    description: 'Meme token on ICP',
    category: 'Meme',
  },
  
  // DeFi Infrastructure
  {
    canisterId: 'gok3y-wqaaa-aaaak-qc6pa-cai',
    name: 'BOOM DAO',
    symbol: 'BOOM',
    logo: '💥',
    description: 'Gaming ecosystem token',
    category: 'Gaming',
  },
  {
    canisterId: 'avqkn-guaaa-aaaaa-qaaea-cai',
    name: 'ICLighthouse',
    symbol: 'ICL',
    logo: '🏮',
    description: 'DeFi infrastructure protocol',
    category: 'DeFi',
  },
  
  // Stablecoins
  {
    canisterId: 'xevnm-gaaaa-aaaar-qafnq-cai',
    name: 'ICDrip',
    symbol: 'DRIP',
    logo: '💧',
    description: 'Liquidity rewards token',
    category: 'DeFi',
  },
  {
    canisterId: 'f54if-eqaaa-aaaaq-aacea-cai',
    name: 'Sneed',
    symbol: 'SNEED',
    logo: '🌱',
    description: 'Community governance token',
    category: 'DAO',
  },
];

const AddTokenModal = ({ isOpen, onClose, onTokenAdded, userPrincipal }) => {
  const [mode, setMode] = useState('search'); // 'search' or 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [canisterId, setCanisterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  // Filter popular tokens based on search
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_TOKENS;
    
    const query = searchQuery.toLowerCase();
    return POPULAR_TOKENS.filter(token =>
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Import from popular tokens list
  const handleImportToken = async (token) => {
    setLoading(true);
    setError('');
    setSelectedToken(token);

    try {
      // Use mock metadata from POPULAR_TOKENS for local development
      // In production, this would fetch from mainnet
      const metadata = {
        name: token.name,
        symbol: token.symbol,
        decimals: 8, // Default decimals
        fee: 10000, // Default fee
        logo: token.logo,
      };

      // Add token immediately
      await onTokenAdded(token.canisterId, metadata);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to add token');
      setLoading(false);
    }
  };

  // Validate custom token by canister ID
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

  const handleAdd = async () => {
    if (preview) {
      await onTokenAdded(canisterId.trim(), preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setMode('search');
    setSearchQuery('');
    setCanisterId('');
    setError('');
    setPreview(null);
    setSelectedToken(null);
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
          className="w-full max-w-lg bg-gradient-to-br from-purple-950/90 to-black/90 backdrop-blur-2xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Import Token</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="px-6 pt-4">
            <div className="flex gap-2 p-1 bg-black/50 rounded-xl">
              <button
                onClick={() => setMode('search')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  mode === 'search'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="inline-block w-4 h-4 mr-2" />
                Search Tokens
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  mode === 'custom'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Wallet className="inline-block w-4 h-4 mr-2" />
                Custom Token
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {mode === 'search' ? (
              <>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or symbol..."
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Token List */}
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {filteredTokens.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No tokens found</p>
                      <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    filteredTokens.map((token) => (
                      <motion.button
                        key={token.canisterId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleImportToken(token)}
                        disabled={loading && selectedToken?.canisterId === token.canisterId}
                        className="w-full p-4 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all text-left group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 text-2xl">
                            {token.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                                {token.name}
                              </h3>
                              <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 rounded">
                                {token.symbol}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate mt-1">
                              {token.description}
                            </p>
                          </div>
                          {loading && selectedToken?.canisterId === token.canisterId ? (
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
                          ) : (
                            <Plus className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>

                {/* Error Message for Search Mode */}
                {error && mode === 'search' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                {/* Custom Token Mode */}
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

                {/* Error Message for Custom Mode */}
                {error && mode === 'custom' && (
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
              </>
            )}
          </div>

          {/* Info Footer */}
          <div className="px-6 py-4 bg-black/30 border-t border-purple-500/20">
            <p className="text-xs text-gray-400 text-center">
              {mode === 'search' 
                ? 'Popular ICP tokens. Always verify the token before adding.'
                : 'Only ICRC-1 compatible tokens can be added. Make sure you trust the token.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Custom Scrollbar Style */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </AnimatePresence>
  );
};

export default AddTokenModal;
