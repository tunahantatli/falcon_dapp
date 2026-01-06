import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Container from './Container';

const signals = [
  { pair: 'BTC/USDT', price: '43,120.50', score: 86, trend: 'up', action: 'Long' },
  { pair: 'ETH/USDT', price: '2,315.10', score: 78, trend: 'up', action: 'Long' },
  { pair: 'SOL/USDT', price: '98.42', score: 49, trend: 'down', action: 'Short' },
  { pair: 'BNB/USDT', price: '315.77', score: 64, trend: 'down', action: 'Short' },
];

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

function actionBadge(action) {
  const isLong = action === 'Long';
  return isLong
    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
    : 'border-rose-400/20 bg-rose-500/10 text-rose-200';
}


export default function Dashboard({ plan, userPlan, status = 'Active' }) {
  const effectivePlan = plan ?? userPlan ?? 'Standard';
  const [lastUpdatedAt] = React.useState(() => Date.now());
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
		const id = setInterval(() => setTick((v) => (v + 1) % 1000000), 30000);
    return () => clearInterval(id);
  }, []);

  const updatedLabel = React.useMemo(() => {
    return formatRelative(Date.now() - lastUpdatedAt);
  }, [lastUpdatedAt, tick]);

  return (
    <div className="pt-24 sm:pt-28">
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
              Real-time mock data for UI validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-md">
              Plan: <span className="text-white">{effectivePlan}</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-md">
              Status: <span className="text-white">{status}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="border-b border-white/10 px-6 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Signals Table</div>
            <div className="mt-1 text-sm text-gray-400">Pair, price, score, trend and action.</div>
          </div>
          <div className="text-xs font-semibold tracking-wide text-white/55">
            Last updated: <span className="text-white/80">{updatedLabel}</span>
          </div>
        </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-wide text-white/60">
                  <th className="px-6 py-4">Pair</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">TCN Score</th>
                  <th className="px-6 py-4">Trend</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {signals.map((s) => (
            <tr key={s.pair} className="text-sm even:bg-white/[0.02]">
                    <td className="px-6 py-5 font-semibold text-white">{s.pair}</td>
                    <td className="px-6 py-5 text-white/85">{s.price}</td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 text-right font-semibold tabular-nums ${scoreClass(s.score)}`}>
                  {s.score}
                </div>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${scoreBarClass(s.score)}`}
                    style={{ width: `${Math.max(0, Math.min(100, s.score))}%` }}
                  />
                </div>
              </div>
            </td>
                    <td className="px-6 py-5">
                      {s.trend === 'up' ? (
                        <div className="inline-flex items-center gap-2 text-emerald-200">
                          <TrendingUp className="h-4 w-4" />
                          Up
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-rose-200">
                          <TrendingDown className="h-4 w-4" />
                          Down
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${actionBadge(s.action)}`}>
                        {s.action}
                      </span>
                    </td>
						</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </div>
  );
}
