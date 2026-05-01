import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

// Sembol → renk paleti (deterministik)
const SYMBOL_COLORS = {
  ICP:    { bg: 'bg-violet-500/25',  border: 'border-violet-400/40',  text: 'text-violet-200'  },
  ckBTC:  { bg: 'bg-orange-500/25',  border: 'border-orange-400/40',  text: 'text-orange-200'  },
  ckETH:  { bg: 'bg-blue-500/25',    border: 'border-blue-400/40',    text: 'text-blue-200'    },
  ckUSDT: { bg: 'bg-emerald-500/25', border: 'border-emerald-400/40', text: 'text-emerald-200' },
  FTCNG:  { bg: 'bg-amber-500/25',   border: 'border-amber-400/40',   text: 'text-amber-200'   },
};

function getColors(symbol) {
  if (SYMBOL_COLORS[symbol]) return SYMBOL_COLORS[symbol];
  // Bilinmeyen tokenler için sembolün char kodundan renk üret
  const hue = [...(symbol || 'T')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return {
    bg: `bg-purple-500/20`,
    border: `border-purple-400/30`,
    text: `text-purple-200`,
  };
}

/**
 * TokenIcon
 * - token.logo (URL)  → <img> ile göster, hata olursa fallback'e geç
 * - FTCNG             → altın jeton emojisi 🪙
 * - Diğerleri         → sembolün ilk 2 harfi, renkli arka plan
 */
export default function TokenIcon({ token, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm:  'w-8  h-8',
    md:  'w-10 h-10',
    lg:  'w-12 h-12',
  };
  const imgClasses = {
    sm:  'w-5  h-5',
    md:  'w-6  h-6',
    lg:  'w-7  h-7',
  };
  const textClasses = {
    sm:  'text-[10px]',
    md:  'text-xs',
    lg:  'text-sm',
  };
  const emojiClasses = {
    sm:  'text-base',
    md:  'text-xl',
    lg:  'text-2xl',
  };

  const symbol   = token?.symbol || '';
  const colors   = getColors(symbol);
  const initials = symbol.slice(0, 2).toUpperCase();

  const containerCls = `flex items-center justify-center ${sizeClasses[size]} rounded-full border ${colors.bg} ${colors.border} flex-shrink-0`;

  // 1. URL varsa ve henüz hata yoksa → <img>
  if (token?.logo && !imgError) {
    return (
      <div className={containerCls}>
        <img
          src={token.logo}
          alt={symbol}
          className={`${imgClasses[size]} rounded-full object-contain`}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 2. FTCNG → altın emojisi
  if (symbol === 'FTCNG') {
    return (
      <div className={containerCls}>
        <span className={emojiClasses[size]} role="img" aria-label="gold">🪙</span>
      </div>
    );
  }

  // 3. Sembol baş harfleri
  if (initials) {
    return (
      <div className={containerCls}>
        <span className={`font-bold ${textClasses[size]} ${colors.text}`}>{initials}</span>
      </div>
    );
  }

  // 4. Son çare: Wallet ikonu
  return (
    <div className={containerCls}>
      <Wallet className={`${imgClasses[size]} text-purple-400`} />
    </div>
  );
}
