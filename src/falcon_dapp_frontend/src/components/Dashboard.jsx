import React from 'react';
import { TrendingDown, TrendingUp, Wallet, ExternalLink, Activity, Target, TrendingUpDown } from 'lucide-react';
import Container from './Container';

const TOKEN_CATEGORIES = {
  'Mega Cap': [
    { id: 'bitcoin', symbol: 'BTC', pair: 'BTCUSDT', score: 86, trend: 'up', chain: 'evm', price: 94250.00 },
    { id: 'ethereum', symbol: 'ETH', pair: 'ETHUSDT', score: 78, trend: 'up', chain: 'evm', price: 3342.50 },
    { id: 'binancecoin', symbol: 'BNB', pair: 'BNBUSDT', score: 64, trend: 'down', chain: 'bsc', price: 685.40 },
    { id: 'solana', symbol: 'SOL', pair: 'SOLUSDT', score: 72, trend: 'up', chain: 'solana', price: 185.20 },
    { id: 'ripple', symbol: 'XRP', pair: 'XRPUSDT', score: 58, trend: 'down', chain: 'evm', price: 2.85 },
  ],
  'Mid Cap': [
    { id: 'sui', symbol: 'SUI', pair: 'SUIUSDT', score: 81, trend: 'up', chain: 'evm', price: 4.52 },
    { id: 'aptos', symbol: 'APT', pair: 'APTUSDT', score: 67, trend: 'up', chain: 'evm', price: 9.85 },
    { id: 'injective-protocol', symbol: 'INJ', pair: 'INJUSDT', score: 74, trend: 'up', chain: 'evm', price: 25.60 },
    { id: 'chainlink', symbol: 'LINK', pair: 'LINKUSDT', score: 69, trend: 'up', chain: 'evm', price: 22.40 },
    { id: 'arbitrum', symbol: 'ARB', pair: 'ARBUSDT', score: 71, trend: 'up', chain: 'evm', price: 0.92 },
  ],
  'Meme/Risk': [
    { id: 'pepe', symbol: 'PEPE', pair: 'PEPEUSDT', score: 88, trend: 'up', chain: 'evm', price: 0.00001840 },
    { id: 'dogwifhat', symbol: 'WIF', pair: 'WIFUSDT', score: 82, trend: 'up', chain: 'solana', price: 2.15 },
    { id: 'dogecoin', symbol: 'DOGE', pair: 'DOGEUSDT', score: 49, trend: 'down', chain: 'evm', price: 0.35 },
  ],
  'GameFi/AI': [
    { id: 'fetch-ai', symbol: 'FET', pair: 'FETUSDT', score: 76, trend: 'up', chain: 'evm', price: 1.48 },
    { id: 'jupiter-exchange-solana', symbol: 'JUP', pair: 'JUPUSDT', score: 73, trend: 'up', chain: 'solana', price: 0.92 },
  ],
};

const DEX_CONFIG = {
  bsc: { name: 'PancakeSwap', url: 'https://pancakeswap.finance/swap', theme: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200 hover:border-yellow-400/50 hover:bg-yellow-500/20' },
  evm: { name: 'Uniswap', url: 'https://app.uniswap.org', theme: 'border-pink-400/30 bg-pink-500/10 text-pink-200 hover:border-pink-400/50 hover:bg-pink-500/20' },
  solana: { name: 'Jupiter', url: 'https://jup.ag', theme: 'border-orange-400/30 bg-orange-500/10 text-orange-200 hover:border-orange-400/50 hover:bg-orange-500/20' },
};

function scoreClass(score) {
  if (score > 80) return 'text-emerald-300';
  if (score < 50) return 'text-rose-300';
  return 'text-white/85';
}

function scoreBarClass(score) {
  if (score > 80) return 'bg-emerald-400/60';
  if (score < 50) return 'bg-rose-400/60';
  return 'bg-white/35';
}

function formatRelative(msAgo) {
  const minutes = Math.floor(msAgo / 60000);
  if (minutes <= 0) return 'just now';
  if (minutes === 1) return '1 min ago';
  return `${minutes} mins ago`;
}

function TradeButton({ walletType, tokenChain }) {
  if (!walletType) {
    return (
      <button 
        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:bg-white/10"
        disabled
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect Wallet
      </button>
    );
  }

  const dexConfig = DEX_CONFIG[tokenChain] || DEX_CONFIG.evm;

  const handleTrade = () => {
    window.open(dexConfig.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleTrade}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${dexConfig.theme}`}
    >
      Trade on {dexConfig.name}
      <ExternalLink className="h-3 w-3" />
    </button>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle, iconColor }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-white/60">{title}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          {subtitle && <div className="mt-1 text-xs text-white/50">{subtitle}</div>}
        </div>
        <div className={`rounded-xl border border-white/10 bg-white/5 p-3 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function CategorySection({ title, tokens, walletType }) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs font-semibold tracking-wide text-white/60">
                <th className="px-6 py-3">Token</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">TCN Score</th>
                <th className="px-6 py-3">Trend</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {tokens.map((token) => {
                const priceDisplay = `$${token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
                
                return (
                  <tr key={token.id} className="text-sm even:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white">{token.symbol}</div>
                        <div className="text-xs text-white/50">{token.pair}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-white/85">{priceDisplay}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 text-right font-semibold tabular-nums ${scoreClass(token.score)}`}>
                          {token.score}
                        </div>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${scoreBarClass(token.score)}`}
                            style={{ width: `${Math.max(0, Math.min(100, token.score))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {token.trend === 'up' ? (
                        <div className="inline-flex items-center gap-1.5 text-emerald-200">
                          <TrendingUp className="h-4 w-4" />
                          Up
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-rose-200">
                          <TrendingDown className="h-4 w-4" />
                          Down
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <TradeButton 
                        walletType={walletType} 
                        tokenChain={token.chain}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ plan, userPlan, status = 'Active', walletType }) {
  const effectivePlan = plan ?? userPlan ?? 'Pro'; // Herkes Pro üye
  const [lastUpdatedAt] = React.useState(() => Date.now());
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setTick((v) => (v + 1) % 1000000), 30000);
    return () => clearInterval(id);
  }, []);

  const updatedLabel = React.useMemo(() => {
    return formatRelative(Date.now() - lastUpdatedAt);
  }, [lastUpdatedAt, tick]);

  const allTokens = Object.values(TOKEN_CATEGORIES).flat();
  const avgScore = Math.round(allTokens.reduce((acc, t) => acc + t.score, 0) / allTokens.length);
  const marketSentiment = avgScore > 70 ? 'Bullish' : avgScore > 50 ? 'Neutral' : 'Bearish';

  return (
    <div className="min-h-screen bg-[#050505] pt-24 sm:pt-28 pb-16">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.24em] text-white/60">
              DASHBOARD
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Live TCN Signals
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Real-time price data from Binance • TCN scores powered by ICP
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-md">
              Plan: <span className="text-white">{effectivePlan}</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-md">
              Status: <span className="text-white">{status}</span>
            </div>
            {walletType && (
              <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 backdrop-blur-md">
                {walletType.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <MetricCard
            icon={Activity}
            title="System Status"
            value="Operational"
            subtitle={`Last sync: ${updatedLabel}`}
            iconColor="text-emerald-300"
          />
          <MetricCard
            icon={Target}
            title="Active TCN Coverage"
            value={allTokens.length}
            subtitle="Tokens monitored"
            iconColor="text-purple-300"
          />
          <MetricCard
            icon={TrendingUpDown}
            title="Market Sentiment"
            value={marketSentiment}
            subtitle={`Avg Score: ${avgScore}/100`}
            iconColor={avgScore > 70 ? 'text-emerald-300' : avgScore > 50 ? 'text-white' : 'text-rose-300'}
          />
        </div>

        <div className="mt-8">
          {Object.entries(TOKEN_CATEGORIES).map(([category, tokens]) => (
            <CategorySection
              key={category}
              title={category}
              tokens={tokens}
              walletType={walletType}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
