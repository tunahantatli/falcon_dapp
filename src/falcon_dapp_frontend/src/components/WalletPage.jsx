import React from 'react';
import { ArrowLeft, Copy, Check, Wallet, TrendingUp, Clock } from 'lucide-react';
import Container from './Container';

export default function WalletPage({ address, onBack }) {
  const [copied, setCopied] = React.useState(false);

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
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-200 via-fuchsia-200 to-purple-200 bg-clip-text text-transparent mb-3">
                  0.00 ICP
                </div>
                <div className="text-purple-300/70 text-lg">
                  ≈ $0.00 USD
                </div>
              </div>
            </div>

            {/* Tokens List - Glassmorphism */}
            <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-black/40 to-purple-950/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl" />
              <h2 className="relative text-lg font-semibold text-purple-200 mb-4">
                Your Tokens
              </h2>
              <div className="relative text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-950/50 border border-purple-500/30 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <Wallet className="h-10 w-10 text-purple-400/60" />
                </div>
                <div className="text-purple-300/70 font-medium">No tokens yet</div>
                <div className="text-sm mt-2 text-purple-400/50">
                  Your tokens will appear here
                </div>
              </div>
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
                  <div className="text-sm font-semibold text-purple-100">0</div>
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
              <h3 className="relative text-sm font-semibold text-purple-200 mb-5 tracking-wide">
                Recent Activity
              </h3>
              <div className="relative text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-950/50 border border-purple-500/30 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <Clock className="h-7 w-7 text-purple-400/60" />
                </div>
                <div className="text-purple-300/70 text-sm">
                  No recent activity
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}