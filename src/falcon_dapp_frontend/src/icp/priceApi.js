// Backend-powered price fetching (HTTPS Outcalls)
import { falcon_dapp_backend } from '../../../declarations/falcon_dapp_backend';

// Token ID mapping for display
const TOKEN_SYMBOLS = {
  'ICP': 'icp',
  'ckBTC': 'ckbtc',
  'ckETH': 'cketh',
  'ckUSDT': 'ckusdt',
};

// Cache for price data (fallback if backend fails)
let priceCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Fetch current prices from backend cache (updated every 5 minutes via timer)
 * @param {string[]} tokenIds - Array of token IDs (e.g., ['icp', 'ckbtc']) - DEPRECATED, ignored
 * @returns {Promise<Object>} - Price data object { icp: { usd: 10.5, usd_24h_change: 0 }, ... }
 */
export const fetchTokenPrices = async (tokenIds = ['icp', 'ckbtc', 'cketh', 'ckusdt']) => {
  try {
    // Check cache
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION && Object.keys(priceCache).length > 0) {
      return priceCache;
    }

    // Fetch from backend
    const backendPrices = await falcon_dapp_backend.getTokenPrices();
    
    // Transform backend response to frontend format
    const prices = {};
    backendPrices.forEach(tokenPrice => {
      const symbol = tokenPrice.symbol;
      const tokenId = TOKEN_SYMBOLS[symbol] || symbol.toLowerCase();
      
      prices[tokenId] = {
        usd: Number(tokenPrice.priceInUsd),
        usd_24h_change: 0, // Backend doesn't track 24h change yet
        usd_24h_vol: 0,
        usd_market_cap: 0,
      };
    });

    // Update cache
    priceCache = prices;
    lastFetchTime = now;

    return prices;
  } catch (error) {
    console.error('Error fetching token prices from backend:', error);
    
    // Return cached data if available
    if (Object.keys(priceCache).length > 0) {
      console.log('⚠️ Using cached prices due to backend error');
      return priceCache;
    }
    
    // Return fallback prices
    return {
      icp: { usd: 0, usd_24h_change: 0, usd_24h_vol: 0, usd_market_cap: 0 },
      ckbtc: { usd: 0, usd_24h_change: 0, usd_24h_vol: 0, usd_market_cap: 0 },
      cketh: { usd: 0, usd_24h_change: 0, usd_24h_vol: 0, usd_market_cap: 0 },
      ckusdt: { usd: 1, usd_24h_change: 0, usd_24h_vol: 0, usd_market_cap: 0 },
    };
  }
};

/**
 * Get price for a single token
 * @param {string} tokenId - Token ID (e.g., 'icp')
 * @returns {Promise<number>} - USD price
 */
export const getTokenPrice = async (tokenId) => {
  const prices = await fetchTokenPrices([tokenId]);
  return prices[tokenId]?.usd || 0;
};

/**
 * Calculate USD value for token amount
 * @param {string} tokenId - Token ID
 * @param {bigint|number} amount - Token amount in base units
 * @param {number} decimals - Token decimals
 * @returns {Promise<number>} - USD value
 */
export const calculateUSDValue = async (tokenId, amount, decimals) => {
  const price = await getTokenPrice(tokenId);
  const tokenAmount = Number(amount) / Math.pow(10, decimals);
  return tokenAmount * price;
};

/**
 * Format price change with color
 * @param {number} change - 24h change percentage
 * @returns {Object} - { text: string, color: string, isPositive: boolean }
 */
export const formatPriceChange = (change) => {
  const isPositive = change >= 0;
  return {
    text: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
    color: isPositive ? 'text-green-400' : 'text-red-400',
    isPositive,
  };
};

/**
 * Format USD price
 * @param {number} price - Price in USD
 * @returns {string} - Formatted price
 */
export const formatUSDPrice = (price) => {
  if (price === 0) return '$0.00';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get historical price data (for charts)
 * @param {string} tokenId - Token ID
 * @param {number} days - Days of history (1, 7, 30, 90, 365)
 * @returns {Promise<Array>} - Array of [timestamp, price]
 */
export const fetchHistoricalPrices = async (tokenId, days = 7) => {
  try {
    const geckoId = TOKEN_IDS[tokenId];
    if (!geckoId) return [];

    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data.prices || [];
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }
};

/**
 * Clear price cache (useful for forcing refresh)
 */
export const clearPriceCache = () => {
  priceCache = {};
  lastFetchTime = 0;
};
