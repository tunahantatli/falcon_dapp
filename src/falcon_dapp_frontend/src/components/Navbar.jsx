import React from 'react';
import Container from './Container';
import ConnectWalletButton from './ConnectWalletButton';

export default function Navbar({ onOpenWallet }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-white/10 bg-[#0a0a0a]/60 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Falcon Logo" className="h-10 w-auto" />
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Pricing
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <ConnectWalletButton onOpenWallet={onOpenWallet} />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
