import React from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { falcon_dapp_backend } from '../../../declarations/falcon_dapp_backend';

const WalletContext = React.createContext(null);

let authClientInstance = null;

const LS_WALLET_TYPE = 'falcon_wallet_type';
const LS_WALLET_ADDRESS = 'falcon_wallet_address';

function formatAddress(address) {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function useWallet() {
  const ctx = React.useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider />');
  return ctx;
}

export default function WalletProvider({ children }) {
  const [status, setStatus] = React.useState('disconnected');
  const [address, setAddress] = React.useState(null);
  const [walletType, setWalletType] = React.useState(null);
  const [chainId, setChainId] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userPlan, setUserPlan] = React.useState(null);
  const [userStatus, setUserStatus] = React.useState(null);

  const isMetaMaskAvailable = typeof window !== 'undefined' && !!window.ethereum;
  const isPhantomAvailable = typeof window !== 'undefined' && !!window.solana?.isPhantom;
  const isTronLinkAvailable = typeof window !== 'undefined' && !!(window.tronLink || window.tronWeb);
  const isIIAvailable = true; // Internet Identity always available (no extension needed)

  // AuthClient instance
  const getAuthClient = React.useCallback(async () => {
    if (!authClientInstance) {
      authClientInstance = await AuthClient.create();
    }
    return authClientInstance;
  }, []);

  // Backend login - non-blocking
  const loginWithBackend = React.useCallback((address) => {
    // Önce authenticated true yap, kullanıcı hemen dashboard'a geçsin
    setIsAuthenticated(true);
    setUserPlan('standard');
    setUserStatus('active');
    
    // Arka planda backend'e login yap
    falcon_dapp_backend.login(address)
      .then(resp => {
        if (resp?.plan) setUserPlan(resp.plan);
        if (resp?.status) setUserStatus(resp.status);
      })
      .catch(err => {
        console.warn('Backend login failed, using defaults:', err);
      });
  }, []);

  // LocalStorage'dan restore + II session check
  React.useEffect(() => {
    const initSession = async () => {
      try {
        const storedType = localStorage.getItem(LS_WALLET_TYPE);
        const storedAddress = localStorage.getItem(LS_WALLET_ADDRESS);
        
        // II session kontrolü
        if (storedType === 'ii') {
          const client = await getAuthClient();
          const isAuth = await client.isAuthenticated();
          if (isAuth) {
            const identity = client.getIdentity();
            const principal = identity.getPrincipal().toString();
            setWalletType('ii');
            setAddress(principal);
            setStatus('connected');
            setIsAuthenticated(true);
            return;
          }
        }
        
        // Diğer wallet'lar için normal restore
        if (storedType && storedAddress && storedType !== 'ii') {
          setWalletType(storedType);
          setAddress(storedAddress);
          setStatus('connected');
          setIsAuthenticated(true);
        }
      } catch {
        // ignore
      }
    };
    
    initSession();
  }, [getAuthClient]);

  const reset = React.useCallback(() => {
    setStatus('disconnected');
    setAddress(null);
    setWalletType(null);
    setChainId(null);
    setError(null);
    setIsAuthenticated(false);
    setUserPlan(null);
    setUserStatus(null);
    try {
      localStorage.removeItem(LS_WALLET_TYPE);
      localStorage.removeItem(LS_WALLET_ADDRESS);
    } catch {
      // ignore
    }
  }, []);

  // --- METAMASK ---
  const connectMetaMask = React.useCallback(async () => {
    setError(null);
    if (!isMetaMaskAvailable) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    try {
      setStatus('connecting');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const nextAddress = accounts[0];
      
      setAddress(nextAddress);
      setWalletType('metamask');
      setStatus('connected');
      
      // LocalStorage'a kaydet
      try {
        localStorage.setItem(LS_WALLET_TYPE, 'metamask');
        localStorage.setItem(LS_WALLET_ADDRESS, nextAddress);
      } catch {}
      
      // Backend login - non-blocking
      loginWithBackend(nextAddress);
    } catch (e) {
      setStatus('error');
      setError(e.message || 'MetaMask connection failed.');
    }
  }, [isMetaMaskAvailable, loginWithBackend]);

  // --- PHANTOM ---
  const connectPhantom = React.useCallback(async () => {
    setError(null);
    if (!isPhantomAvailable) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      setStatus('connecting');
      const response = await window.solana.connect({ onlyIfTrusted: false });
      const pubkey = response.publicKey.toString();
      
      setAddress(pubkey);
      setWalletType('phantom');
      setStatus('connected');
      
      // LocalStorage'a kaydet
      try {
        localStorage.setItem(LS_WALLET_TYPE, 'phantom');
        localStorage.setItem(LS_WALLET_ADDRESS, pubkey);
      } catch {}
      
      // Backend login - non-blocking
      loginWithBackend(pubkey);
    } catch (e) {
      setStatus('error');
      setError(e.message || 'Phantom connection failed.');
    }
  }, [isPhantomAvailable, loginWithBackend]);

  // --- TRONLINK ---
  const connectTronLink = React.useCallback(async () => {
    setError(null);
    if (!isTronLinkAvailable) {
      window.open('https://www.tronlink.org/', '_blank');
      return;
    }
    try {
      setStatus('connecting');
      
      // TronLink request API kullan
      const tronRequest = window.tronLink?.request || window.tronWeb?.request;
      if (tronRequest) {
        await tronRequest({ method: 'tron_requestAccounts' });
      }
      
      // TronWeb'in hazır olmasını bekle - daha agresif polling
      let attempts = 0;
      while (attempts < 30 && !window.tronWeb?.defaultAddress?.base58) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      const address = window.tronWeb?.defaultAddress?.base58;
      if (!address) {
        throw new Error('TronLink is locked or address not available.');
      }
      
      setAddress(address);
      setWalletType('tron');
      setStatus('connected');
      
      // LocalStorage'a kaydet
      try {
        localStorage.setItem(LS_WALLET_TYPE, 'tron');
        localStorage.setItem(LS_WALLET_ADDRESS, address);
      } catch {}
      
      // Backend login - non-blocking
      loginWithBackend(address);
    } catch (e) {
      setStatus('error');
      setError(e.message || 'TronLink connection failed.');
    }
  }, [isTronLinkAvailable, loginWithBackend]);

  // --- INTERNET IDENTITY ---
  const connectII = React.useCallback(async () => {
    setError(null);
    try {
      setStatus('connecting');
      
      const client = await getAuthClient();
      
      // Local development için production II kullan (local II canister yok)
      const identityProvider = 'https://identity.ic0.app';
      
      await client.login({
        identityProvider,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
        onSuccess: async () => {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal().toString();
          
          setAddress(principal);
          setWalletType('ii');
          setChainId('icp');
          setStatus('connected');
          
          // LocalStorage'a kaydet
          try {
            localStorage.setItem(LS_WALLET_TYPE, 'ii');
            localStorage.setItem(LS_WALLET_ADDRESS, principal);
          } catch {}
          
          // Backend login - non-blocking
          loginWithBackend(principal);
        },
        onError: (error) => {
          setStatus('error');
          setError(error?.message || 'Internet Identity login failed.');
        },
      });
    } catch (e) {
      setStatus('error');
      setError(e.message || 'Internet Identity connection failed.');
    }
  }, [getAuthClient, loginWithBackend]);

  const disconnect = React.useCallback(async () => {
    if (walletType === 'phantom' && window.solana?.disconnect) {
      window.solana.disconnect();
    }
    if (walletType === 'ii') {
      const client = await getAuthClient();
      await client.logout();
    }
    reset();
  }, [reset, walletType, getAuthClient]);

  const value = React.useMemo(() => ({
    status, address, walletType, shortAddress: formatAddress(address),
    chainId, error, isMetaMaskAvailable, isPhantomAvailable, isTronLinkAvailable, isIIAvailable,
    isAuthenticated, userPlan, userStatus,
    connectMetaMask, connectPhantom, connectTronLink, connectII, disconnect, reset
  }), [status, address, walletType, chainId, error, isMetaMaskAvailable, isPhantomAvailable, isTronLinkAvailable, isIIAvailable, isAuthenticated, userPlan, userStatus, connectMetaMask, connectPhantom, connectTronLink, connectII, disconnect, reset]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}