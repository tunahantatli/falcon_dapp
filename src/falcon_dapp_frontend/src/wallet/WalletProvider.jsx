import React from 'react';
import { BrowserProvider } from 'ethers';

const WalletContext = React.createContext(null);

function formatAddress(address) {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function useWallet() {
  const ctx = React.useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within <WalletProvider />');
  }
  return ctx;
}

export default function WalletProvider({ children }) {
  const [status, setStatus] = React.useState('disconnected');
  const [address, setAddress] = React.useState(null);
  const [chainId, setChainId] = React.useState(null);
  const [error, setError] = React.useState(null);

  const isInjectedAvailable = typeof window !== 'undefined' && !!window.ethereum;

  const reset = React.useCallback(() => {
    setStatus('disconnected');
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  const connect = React.useCallback(async () => {
    setError(null);

    if (!isInjectedAvailable) {
      setStatus('error');
      setError('No injected wallet found. Please install MetaMask.');
      return;
    }

    try {
      setStatus('connecting');

      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      const signer = await provider.getSigner();
      const nextAddress = await signer.getAddress();
      const network = await provider.getNetwork();

      setAddress(nextAddress);
      setChainId(Number(network.chainId));
      setStatus('connected');
    } catch (e) {
      const message = e?.shortMessage || e?.message || 'Wallet connection failed.';
      setStatus('error');
      setError(message);
    }
  }, [isInjectedAvailable]);

  const disconnect = React.useCallback(() => {
    // Injected wallets don't support programmatic disconnect reliably.
    // We clear local state and rely on the wallet for session persistence.
    reset();
  }, [reset]);

  React.useEffect(() => {
    if (!isInjectedAvailable) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        reset();
        return;
      }
      setAddress(accounts[0]);
      setStatus('connected');
    };

    const handleChainChanged = (hexChainId) => {
      const nextChainId = Number.parseInt(hexChainId, 16);
      setChainId(Number.isFinite(nextChainId) ? nextChainId : null);
    };

    const handleDisconnect = () => {
      reset();
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);
    window.ethereum.on?.('disconnect', handleDisconnect);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      window.ethereum.removeListener?.('disconnect', handleDisconnect);
    };
  }, [isInjectedAvailable, reset]);

  const value = React.useMemo(
    () => ({
      status,
      address,
      shortAddress: formatAddress(address),
      chainId,
      error,
      isInjectedAvailable,
      connect,
      disconnect,
      reset,
    }),
    [status, address, chainId, error, isInjectedAvailable, connect, disconnect, reset],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
