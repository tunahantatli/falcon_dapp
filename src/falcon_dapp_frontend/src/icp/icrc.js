import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IcrcLedgerCanister } from "@dfinity/ledger-icrc";

// ICP Ecosystem Token Configurations
export const DEFAULT_TOKENS = [
  {
    id: "icp",
    name: "Internet Computer",
    symbol: "ICP",
    canisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai", // ICP Ledger
    decimals: 8,
    logo: "https://cryptologos.cc/logos/internet-computer-icp-logo.png",
    fee: 10000, // 0.0001 ICP
  },
  {
    id: "ckbtc",
    name: "Chain Key Bitcoin",
    symbol: "ckBTC",
    canisterId: "mxzaz-hqaaa-aaaar-qaada-cai", // ckBTC Ledger
    decimals: 8,
    logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    fee: 10, // 0.0000001 ckBTC
    depositInfo: {
      chain: "Bitcoin",
      instruction: "Send Bitcoin to this address to receive ckBTC",
    },
  },
  {
    id: "cketh",
    name: "Chain Key Ethereum",
    symbol: "ckETH",
    canisterId: "ss2fx-dyaaa-aaaar-qacoq-cai", // ckETH Ledger
    decimals: 18,
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    fee: 2000000000000, // ~0.000002 ckETH
    depositInfo: {
      chain: "Ethereum",
      instruction: "Send Ethereum to this address to receive ckETH",
    },
  },
  {
    id: "ckusdt",
    name: "Chain Key Tether",
    symbol: "ckUSDT",
    canisterId: "cngnf-vqaaa-aaaar-qag4q-cai", // ckUSDT Ledger (Mainnet)
    decimals: 6,
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    fee: 10000, // 0.01 USDT
    depositInfo: {
      chain: "Ethereum",
      instruction: "Send USDT (ERC-20) to this address to receive ckUSDT",
    },
  },
];

// Create HttpAgent
const createAgent = async () => {
  const agent = new HttpAgent({
    host: process.env.DFX_NETWORK === "ic" 
      ? "https://ic0.app" 
      : "http://localhost:4943",
  });

  // Fetch root key for local development
  if (process.env.DFX_NETWORK !== "ic") {
    await agent.fetchRootKey();
  }

  return agent;
};

// Get ICRC-1 Ledger instance
export const getIcrcLedger = async (canisterId) => {
  const agent = await createAgent();
  return IcrcLedgerCanister.create({
    agent,
    canisterId: Principal.fromText(canisterId),
  });
};

// Get token balance
export const getTokenBalance = async (canisterId, accountPrincipal) => {
  try {
    const ledger = await getIcrcLedger(canisterId);
    const balance = await ledger.balance({
      owner: Principal.fromText(accountPrincipal),
      certified: false,
    });
    return balance;
  } catch (error) {
    console.error(`Error fetching balance for ${canisterId}:`, error);
    return 0n;
  }
};

// Get token metadata (name, symbol, decimals)
export const getTokenMetadata = async (canisterId) => {
  try {
    const ledger = await getIcrcLedger(canisterId);
    const metadata = await ledger.metadata({});
    
    // Parse metadata array
    const metadataObj = {};
    metadata.forEach(([key, value]) => {
      if ('Text' in value) {
        metadataObj[key] = value.Text;
      } else if ('Nat' in value) {
        metadataObj[key] = Number(value.Nat);
      }
    });

    return {
      name: metadataObj['icrc1:name'] || 'Unknown Token',
      symbol: metadataObj['icrc1:symbol'] || 'TOKEN',
      decimals: metadataObj['icrc1:decimals'] || 8,
      fee: metadataObj['icrc1:fee'] || 10000,
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${canisterId}:`, error);
    return null;
  }
};

// Transfer tokens
export const transferToken = async (canisterId, toAddress, amount, fromPrincipal) => {
  try {
    const ledger = await getIcrcLedger(canisterId);
    
    const result = await ledger.transfer({
      to: {
        owner: Principal.fromText(toAddress),
        subaccount: [],
      },
      amount: BigInt(amount),
      from_subaccount: [],
      fee: [],
      memo: [],
      created_at_time: [],
    });

    if ('Ok' in result) {
      return { success: true, blockHeight: result.Ok };
    } else {
      return { success: false, error: result.Err };
    }
  } catch (error) {
    console.error(`Transfer error:`, error);
    return { success: false, error: error.message };
  }
};

// Get deposit address for cross-chain tokens (ckBTC, ckETH, ckUSDT)
export const getDepositAddress = async (tokenId, userPrincipal) => {
  try {
    const token = DEFAULT_TOKENS.find(t => t.id === tokenId);
    if (!token?.depositInfo) {
      throw new Error("This token doesn't support cross-chain deposits");
    }

    // For ckBTC, ckETH, ckUSDT - each has a minter canister
    // that generates unique deposit addresses per user
    const minterCanisterIds = {
      ckbtc: "mqygn-kiaaa-aaaar-qaadq-cai",
      cketh: "sv3dd-oaaaa-aaaar-qacoa-cai", 
      ckusdt: "jzenf-aiaaa-aaaar-qaa7q-cai",
    };

    const minterId = minterCanisterIds[tokenId];
    if (!minterId) return null;

    const agent = await createAgent();
    
    // Call minter's get_btc_address / get_eth_address method
    const actor = Actor.createActor(
      ({ IDL }) => IDL.Service({
        get_btc_address: IDL.Func(
          [IDL.Record({ owner: IDL.Opt(IDL.Principal), subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })],
          [IDL.Text],
          ['query']
        ),
        get_eth_address: IDL.Func(
          [IDL.Record({ owner: IDL.Opt(IDL.Principal), subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })],
          [IDL.Text],
          ['query']
        ),
      }),
      {
        agent,
        canisterId: minterId,
      }
    );

    const methodName = tokenId === 'ckbtc' ? 'get_btc_address' : 'get_eth_address';
    const address = await actor[methodName]({
      owner: [Principal.fromText(userPrincipal)],
      subaccount: [],
    });

    return address;
  } catch (error) {
    console.error(`Error getting deposit address:`, error);
    return null;
  }
};

// Format token amount with decimals
export const formatTokenAmount = (amount, decimals) => {
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
};

// Parse user input to token units
export const parseTokenAmount = (amountString, decimals) => {
  const value = parseFloat(amountString);
  return BigInt(Math.floor(value * Math.pow(10, decimals)));
};

// Get all token balances for user
export const getAllBalances = async (userPrincipal, customTokens = []) => {
  const allTokens = [...DEFAULT_TOKENS, ...customTokens];
  
  const balances = await Promise.all(
    allTokens.map(async (token) => {
      const balance = await getTokenBalance(token.canisterId, userPrincipal);
      return {
        ...token,
        balance,
        balanceFormatted: formatTokenAmount(balance, token.decimals),
      };
    })
  );

  return balances;
};

// ⚠️ DEPRECATED: LocalStorage functions moved to preferences.js
// Use getCustomTokens(), addCustomToken(), removeCustomToken() from preferences.js instead

// Transaction History Functions (ICRC-3 Standard)

/**
 * Fetch transaction history for an account
 * @param {string} canisterId - Ledger canister ID
 * @param {string} accountPrincipal - Account principal
 * @param {number} start - Start index (for pagination)
 * @param {number} length - Number of transactions to fetch
 * @returns {Promise<Array>} - Array of transaction objects
 */
export const getTransactionHistory = async (canisterId, accountPrincipal, start = 0, length = 20) => {
  try {
    const agent = await createAgent();
    const principal = Principal.fromText(accountPrincipal);

    // Create actor for ICRC-3 get_transactions
    const actor = Actor.createActor(
      ({ IDL }) => IDL.Service({
        get_transactions: IDL.Func(
          [IDL.Record({ 
            start: IDL.Nat,
            length: IDL.Nat 
          })],
          [IDL.Record({
            transactions: IDL.Vec(IDL.Record({
              id: IDL.Nat,
              timestamp: IDL.Nat64,
              transaction: IDL.Variant({
                burn: IDL.Record({
                  from: IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) }),
                  amount: IDL.Nat,
                  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
                }),
                mint: IDL.Record({
                  to: IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) }),
                  amount: IDL.Nat,
                  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
                }),
                transfer: IDL.Record({
                  from: IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) }),
                  to: IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) }),
                  amount: IDL.Nat,
                  fee: IDL.Opt(IDL.Nat),
                  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
                }),
              })
            })),
            oldest_tx_id: IDL.Opt(IDL.Nat),
          })],
          ['query']
        ),
      }),
      { agent, canisterId }
    );

    const result = await actor.get_transactions({ start: BigInt(start), length: BigInt(length) });
    
    // Filter and format transactions for this account
    const transactions = result.transactions
      .map(tx => {
        const transaction = tx.transaction;
        let type, from, to, amount, status = 'completed';

        if ('transfer' in transaction) {
          const transfer = transaction.transfer;
          type = transfer.from.owner.toText() === accountPrincipal ? 'send' : 'receive';
          from = transfer.from.owner.toText();
          to = transfer.to.owner.toText();
          amount = transfer.amount;
        } else if ('mint' in transaction) {
          const mint = transaction.mint;
          type = 'receive';
          from = 'Minter';
          to = mint.to.owner.toText();
          amount = mint.amount;
        } else if ('burn' in transaction) {
          const burn = transaction.burn;
          type = 'send';
          from = burn.from.owner.toText();
          to = 'Burned';
          amount = burn.amount;
        }

        // Only include transactions involving this account
        if (from !== accountPrincipal && to !== accountPrincipal) {
          return null;
        }

        return {
          id: Number(tx.id),
          timestamp: Number(tx.timestamp) / 1000000, // Convert to milliseconds
          type,
          from,
          to,
          amount,
          status,
          hash: `0x${tx.id.toString(16)}`,
        };
      })
      .filter(tx => tx !== null);

    return transactions;
  } catch (error) {
    console.error(`Error fetching transaction history for ${canisterId}:`, error);
    return [];
  }
};

/**
 * Get recent transactions for multiple tokens
 * @param {string} userPrincipal - User's principal
 * @param {Array} tokens - Array of token objects
 * @param {number} limit - Max transactions per token
 * @returns {Promise<Array>} - Combined and sorted transactions
 */
export const getRecentTransactions = async (userPrincipal, tokens, limit = 10) => {
  try {
    const allTransactions = [];

    // Fetch transactions for each token
    for (const token of tokens) {
      const txs = await getTransactionHistory(token.canisterId, userPrincipal, 0, limit);
      
      // Add token info to each transaction
      const txsWithToken = txs.map(tx => ({
        ...tx,
        tokenSymbol: token.symbol,
        tokenDecimals: token.decimals,
        tokenLogo: token.logo,
        tokenId: token.id,
      }));

      allTransactions.push(...txsWithToken);
    }

    // Sort by timestamp (newest first)
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

/**
 * Format transaction for display
 * @param {Object} transaction - Transaction object
 * @returns {Object} - Formatted transaction
 */
export const formatTransaction = (transaction) => {
  const date = new Date(transaction.timestamp);
  const amount = formatTokenAmount(transaction.amount, transaction.tokenDecimals);
  
  return {
    ...transaction,
    dateFormatted: date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    timeFormatted: date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    amountFormatted: `${amount} ${transaction.tokenSymbol}`,
    shortHash: `${transaction.hash.slice(0, 6)}...${transaction.hash.slice(-4)}`,
  };
};

