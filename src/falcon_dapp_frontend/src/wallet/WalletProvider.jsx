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

  const isIIAvailable = true; // Internet Identity always available (no extension needed)

  // AuthClient instance
  const getAuthClient = React.useCallback(async () => {
    if (!authClientInstance) {
      authClientInstance = await AuthClient.create();
    }
    return authClientInstance;
  }, []);

  // Falcon Wallet: Falcon ID ile giriş yapan herkes otomatik onaylı kullanıcı
  const activateWallet = React.useCallback((address) => {
    setIsAuthenticated(true);
    setUserPlan('Pro'); // Herkese Pro erişim
    setUserStatus('Active');
    console.log('🦅 Falcon Wallet activated for:', address);
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
            activateWallet(principal);
            return;
          }
        }
        
        // Diğer wallet'lar için normal restore
        if (storedType && storedAddress && storedType !== 'ii') {
          setWalletType(storedType);
          setAddress(storedAddress);
          setStatus('connected');
          activateWallet(storedAddress);
        }
      } catch {
        // ignore
      }
    };
    
    initSession();
  }, [getAuthClient, activateWallet]);

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
          
          // Falcon Wallet'ı aktifleştir
          activateWallet(principal);
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
  }, [getAuthClient, activateWallet]);

  const disconnect = React.useCallback(async () => {
    if (walletType === 'ii') {
      const client = await getAuthClient();
      await client.logout();
    }
    reset();
  }, [reset, walletType, getAuthClient]);

  const value = React.useMemo(() => ({
    status, address, walletType, shortAddress: formatAddress(address),
    chainId, error, isIIAvailable,
    isAuthenticated, userPlan, userStatus,
    connectII, disconnect, reset
  }), [status, address, walletType, chainId, error, isIIAvailable, isAuthenticated, userPlan, userStatus, connectII, disconnect, reset]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}