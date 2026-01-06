import React from 'react';
import { Github, Twitter } from 'lucide-react';
import Container from './Container';

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10 bg-[#0a0a0a]/60 backdrop-blur-md sm:mt-24">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Falcon Dapp</div>
            <div className="mt-2 text-sm text-gray-400">
              Not Financial Advice. For information purposes only.
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Twitter className="h-4 w-4 text-white/70" />
              Twitter
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Github className="h-4 w-4 text-purple-300" />
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
