import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownUp, Settings, Loader2, AlertCircle, CheckCircle2, ExternalLink, ChevronDown } from 'lucide-react';
import { AuthClient } from '@dfinity/auth-client';
import TokenIcon from './TokenIcon';
import { DEFAULT_TOKENS } from '../icp/icrc';
import {
  findPool,
  getQuote,
  getPoolTokenFees,
  executeSwap,
  getTokenStandard,
} from '../icp/icpswap';

// Supported tokens for swap (mainnet only)
const SWAP_TOKENS = DEFAULT_TOKENS.filter(t =>
  ['ICP', 'ckBTC', 'ckETH', 'ckUSDT'].includes(t.symbol)
);

const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

const DEFAULT_SLIPPAGE = 0.5; // %

function formatAmount(raw, decimals) {
  if (!raw && raw !== 0n) return '0';
  const n = Number(raw) / Math.pow(10, decimals);
  if (n === 0) return '0';
  if (n < 0.000001) return n.toExponential(4);
  if (n < 1) return n.toFixed(6);
  if (n < 1000) return n.toFixed(4);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function parseAmount(str, decimals) {
  const n = parseFloat(str);
  if (isNaN(n) || n <= 0) return 0n;
  return BigInt(Math.floor(n * Math.pow(10, decimals)));
}

function TokenSelector({ token, tokens, onSelect, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="text-xs text-purple-400/60 mb-1.5">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-2.5 bg-purple-950/60 border border-purple-500/30 rounded-xl hover:border-purple-400/50 transition-all"
      >
        <TokenIcon token={token} size="sm" />
        <span className="text-white font-semibold text-sm">{token?.symbol || 'Select'}</span>
        <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full mt-2 z-50 w-44 bg-gradient-to-br from-purple-950 to-black border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden"
          >
            {tokens.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onSelect(t); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-800/40 transition-colors"
              >
                <TokenIcon token={t} size="sm" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{t.symbol}</div>
                  <div className="text-xs text-purple-400/60 truncate">{t.name}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SwapModal = ({ isOpen, onClose, initialToken = null, tokens = [] }) => {
  // Merge wallet tokens and static swap tokens for selector
  const availableTokens = React.useMemo(() => {
    const map = new Map();
    SWAP_TOKENS.forEach(t => map.set(t.canisterId, t));
    tokens.filter(t => ['ICP', 'ckBTC', 'ckETH', 'ckUSDT'].includes(t.symbol))
      .forEach(t => map.set(t.canisterId, { ...map.get(t.canisterId), ...t }));
    return [...map.values()];
  }, [tokens]);

  const [tokenIn, setTokenIn] = useState(() =>
    initialToken || availableTokens.find(t => t.symbol === 'ICP') || availableTokens[0]
  );
  const [tokenOut, setTokenOut] = useState(() =>
    availableTokens.find(t => t.symbol === 'ckUSDT') || availableTokens[1]
  );

  const [amountIn, setAmountIn] = useState('');
  const [quoteOut, setQuoteOut] = useState(null);      // bigint
  const [poolId, setPoolId] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);      // { zeroForOne, token0Fee, token1Fee }
  const [feeTier, setFeeTier] = useState(3000);

  const [loadingPool, setLoadingPool] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [noPool, setNoPool] = useState(false);

  const isLocal = typeof process !== 'undefined' && process.env?.DFX_NETWORK !== 'ic';

  // ── Pool lookup ──────────────────────────────
  useEffect(() => {
    if (!tokenIn || !tokenOut || tokenIn.canisterId === tokenOut.canisterId) return;
    setPoolId(null);
    setPoolInfo(null);
    setQuoteOut(null);
    setNoPool(false);
    setError('');

    let cancelled = false;
    setLoadingPool(true);
    findPool(
      { canisterId: tokenIn.canisterId, standard: getTokenStandard(tokenIn.canisterId) },
      { canisterId: tokenOut.canisterId, standard: getTokenStandard(tokenOut.canisterId) },
      feeTier
    ).then(async (pool) => {
      if (cancelled) return;
      if (!pool) { setNoPool(true); setLoadingPool(false); return; }
      const fees = await getPoolTokenFees(pool.poolId);
      if (cancelled) return;
      setPoolId(pool.poolId);
      setPoolInfo({ zeroForOne: pool.zeroForOne, ...fees });
      setLoadingPool(false);
    }).catch(() => { if (!cancelled) { setNoPool(true); setLoadingPool(false); } });

    return () => { cancelled = true; };
  }, [tokenIn, tokenOut, feeTier]);

  // ── Quote ────────────────────────────────────
  const quoteDebounceRef = useRef(null);
  useEffect(() => {
    if (!poolId || !poolInfo || !amountIn || parseFloat(amountIn) <= 0) {
      setQuoteOut(null);
      return;
    }
    clearTimeout(quoteDebounceRef.current);
    quoteDebounceRef.current = setTimeout(async () => {
      setLoadingQuote(true);
      const rawIn = parseAmount(amountIn, tokenIn.decimals);
      const q = await getQuote(poolId, poolInfo.zeroForOne, rawIn);
      setQuoteOut(q);
      setLoadingQuote(false);
    }, 500);
    return () => clearTimeout(quoteDebounceRef.current);
  }, [amountIn, poolId, poolInfo, tokenIn]);

  // ── Swap tokens (flip) ───────────────────────
  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn('');
    setQuoteOut(null);
    setError('');
  };

  // ── Execute swap ─────────────────────────────
  const handleSwap = async () => {
    setError('');
    setSuccess('');
    if (!poolId || !poolInfo) { setError('No liquidity pool found for this pair.'); return; }
    if (!amountIn || parseFloat(amountIn) <= 0) { setError('Enter an amount to swap.'); return; }
    if (!quoteOut) { setError('Could not get quote. Try again.'); return; }

    if (isLocal) {
      setError('Swap is only available on mainnet. Run with --network ic.');
      return;
    }

    setSwapping(true);
    try {
      let authClient = await AuthClient.create();
      if (!(await authClient.isAuthenticated())) {
        setError('Please connect via Internet Identity to swap.');
        setSwapping(false);
        return;
      }
      const identity = authClient.getIdentity();
      const rawIn = parseAmount(amountIn, tokenIn.decimals);
      const slippageFactor = BigInt(Math.floor((1 - slippage / 100) * 1e6));
      const amountOutMin = (quoteOut * slippageFactor) / 1_000_000n;

      const tokenInFee = poolInfo.zeroForOne ? poolInfo.token0Fee : poolInfo.token1Fee;
      const tokenOutFee = poolInfo.zeroForOne ? poolInfo.token1Fee : poolInfo.token0Fee;

      const result = await executeSwap({
        poolId,
        zeroForOne: poolInfo.zeroForOne,
        tokenInCanisterId: tokenIn.canisterId,
        amountIn: rawIn,
        amountOutMinimum: amountOutMin,
        tokenInFee,
        tokenOutFee,
        identity,
      });

      if (result.success) {
        const outFormatted = formatAmount(result.amountOut, tokenOut.decimals);
        setSuccess(`Swap successful! Received ${outFormatted} ${tokenOut.symbol}`);
        setAmountIn('');
        setQuoteOut(null);
      } else {
        setError(`Swap failed: ${result.error}`);
      }
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setSwapping(false);
    }
  };

  // ── Price impact estimate ─────────────────────
  const priceImpact = null; // would need pool state for exact calc

  const amountOutFormatted = quoteOut != null ? formatAmount(quoteOut, tokenOut.decimals) : '';
  const canSwap = !!poolId && !!amountIn && parseFloat(amountIn) > 0 && !!quoteOut && !swapping;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-gradient-to-br from-purple-950/95 to-black/95 backdrop-blur-2xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-purple-500/20 rounded-lg">
                <ArrowDownUp className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Swap Tokens</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                via ICPSwap
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(s => !s)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-purple-500/20 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-purple-500/10"
              >
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Slippage Tolerance</span>
                    <div className="flex items-center gap-2">
                      {[0.1, 0.5, 1.0].map(v => (
                        <button
                          key={v}
                          onClick={() => setSlippage(v)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${slippage === v ? 'bg-purple-500 text-white' : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/50'}`}
                        >
                          {v}%
                        </button>
                      ))}
                      <input
                        type="number"
                        value={slippage}
                        onChange={e => setSlippage(Math.max(0.01, Math.min(50, parseFloat(e.target.value) || 0.5)))}
                        className="w-16 px-2 py-1 text-xs bg-black/50 border border-purple-500/30 rounded-lg text-white text-center focus:outline-none focus:border-purple-500"
                        step="0.1"
                        min="0.01"
                        max="50"
                      />
                      <span className="text-xs text-purple-400">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Fee Tier</span>
                    <div className="flex items-center gap-2">
                      {FEE_TIERS.map(f => (
                        <button
                          key={f}
                          onClick={() => setFeeTier(f)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${feeTier === f ? 'bg-purple-500 text-white' : 'bg-purple-950/50 text-purple-300 hover:bg-purple-900/50'}`}
                        >
                          {f / 10000}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main swap form */}
          <div className="p-6 space-y-3">

            {/* Token In */}
            <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <TokenSelector
                  token={tokenIn}
                  tokens={availableTokens.filter(t => t.canisterId !== tokenOut?.canisterId)}
                  onSelect={t => { setTokenIn(t); setAmountIn(''); setQuoteOut(null); }}
                  label="You Pay"
                />
                <div className="text-right">
                  <div className="text-xs text-purple-400/60 mb-1.5">Amount</div>
                  <input
                    type="number"
                    value={amountIn}
                    onChange={e => setAmountIn(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className="w-36 text-right text-xl font-bold bg-transparent text-white placeholder-purple-400/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleFlip}
                className="p-2 rounded-full bg-purple-950/80 border border-purple-500/30 hover:bg-purple-900/80 hover:border-purple-400/50 transition-all group"
              >
                <ArrowDownUp className="w-4 h-4 text-purple-400 group-hover:text-purple-200 transition-colors" />
              </button>
            </div>

            {/* Token Out */}
            <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <TokenSelector
                  token={tokenOut}
                  tokens={availableTokens.filter(t => t.canisterId !== tokenIn?.canisterId)}
                  onSelect={t => { setTokenOut(t); setQuoteOut(null); }}
                  label="You Receive"
                />
                <div className="text-right">
                  <div className="text-xs text-purple-400/60 mb-1.5">Estimated</div>
                  <div className="text-xl font-bold text-purple-100">
                    {loadingQuote ? (
                      <span className="inline-flex items-center gap-1 text-base text-purple-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> ...
                      </span>
                    ) : (
                      amountOutFormatted || <span className="text-purple-400/40">0.00</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pool / rate info */}
            {loadingPool && (
              <div className="flex items-center gap-2 text-xs text-purple-400/70 px-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Looking for pool...
              </div>
            )}

            {noPool && !loadingPool && (
              <div className="flex items-center gap-2 text-xs text-amber-400/80 px-1">
                <AlertCircle className="w-3 h-3" />
                No liquidity pool found for this pair / fee tier. Try another fee tier.
              </div>
            )}

            {poolId && !loadingPool && quoteOut && (
              <div className="px-1 space-y-1.5 text-xs text-purple-300/70">
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span className="text-purple-200">
                    1 {tokenIn.symbol} ≈ {
                      formatAmount(
                        quoteOut * BigInt(Math.pow(10, tokenIn.decimals)) / parseAmount(amountIn, tokenIn.decimals),
                        tokenOut.decimals
                      )
                    } {tokenOut.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage</span>
                  <span className="text-purple-200">{slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Min. received</span>
                  <span className="text-purple-200">
                    {formatAmount(
                      quoteOut * BigInt(Math.floor((1 - slippage / 100) * 1e6)) / 1_000_000n,
                      tokenOut.decimals
                    )} {tokenOut.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pool fee</span>
                  <span className="text-purple-200">{feeTier / 10000}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pool</span>
                  <a
                    href={`https://app.icpswap.com/swap?input=${tokenIn.canisterId}&output=${tokenOut.canisterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-300 hover:text-purple-100 transition-colors"
                  >
                    ICPSwap <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Local warning */}
            {isLocal && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Swap requires mainnet connection. Deploy with <code className="font-mono">--network ic</code> to enable live swaps.
                </p>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-300">{success}</p>
              </motion.div>
            )}

            {/* Swap button */}
            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all
                bg-gradient-to-r from-purple-600 to-fuchsia-600
                hover:from-purple-500 hover:to-fuchsia-500
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white shadow-lg shadow-purple-500/30
                flex items-center justify-center gap-2"
            >
              {swapping ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Swapping...</>
              ) : noPool ? (
                'No Pool Found'
              ) : !amountIn || parseFloat(amountIn) <= 0 ? (
                'Enter Amount'
              ) : loadingPool || loadingQuote ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
              ) : (
                `Swap ${tokenIn?.symbol || ''} → ${tokenOut?.symbol || ''}`
              )}
            </button>

            <p className="text-center text-xs text-purple-400/50">
              Powered by{' '}
              <a
                href="https://app.icpswap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-200 transition-colors"
              >
                ICPSwap v3
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SwapModal;
