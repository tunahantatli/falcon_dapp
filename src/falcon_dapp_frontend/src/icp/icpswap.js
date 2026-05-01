import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// ─────────────────────────────────────────────
// ICPSwap Mainnet Canister IDs
// ─────────────────────────────────────────────
export const ICPSWAP_FACTORY_ID = '4mmnk-kiaaa-aaaag-qbllq-cai';

const IS_LOCAL = typeof process !== 'undefined' && process.env?.DFX_NETWORK !== 'ic';
const IC_HOST  = 'https://ic0.app';

// ─────────────────────────────────────────────
// Candid interfaces (minimal, only what we need)
// ─────────────────────────────────────────────
const factoryIdl = ({ IDL }) => {
  const Token = IDL.Record({ address: IDL.Text, standard: IDL.Text });
  const PoolData = IDL.Record({
    canisterId: IDL.Principal,
    token0: Token,
    token1: Token,
    fee: IDL.Nat,
    key: IDL.Text,
  });
  const Error = IDL.Variant({
    CommonError: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text,
    InsufficientFunds: IDL.Null,
  });
  return IDL.Service({
    getPool: IDL.Func(
      [IDL.Record({ token0: Token, token1: Token, fee: IDL.Nat })],
      [IDL.Variant({ ok: PoolData, err: Error })],
      ['query'],
    ),
  });
};

const poolIdl = ({ IDL }) => {
  const SwapArgs = IDL.Record({
    amountIn: IDL.Text,
    amountOutMinimum: IDL.Text,
    zeroForOne: IDL.Bool,
  });
  const DepositAndSwapArgs = IDL.Record({
    amountIn: IDL.Text,
    amountOutMinimum: IDL.Text,
    zeroForOne: IDL.Bool,
    tokenInFee: IDL.Nat,
    tokenOutFee: IDL.Nat,
  });
  const Error = IDL.Variant({
    CommonError: IDL.Null,
    InternalError: IDL.Text,
    UnsupportedToken: IDL.Text,
    InsufficientFunds: IDL.Null,
  });
  const PoolMetadata = IDL.Record({
    key: IDL.Text,
    token0: IDL.Record({ address: IDL.Text, standard: IDL.Text }),
    token1: IDL.Record({ address: IDL.Text, standard: IDL.Text }),
    fee: IDL.Nat,
    tick: IDL.Int,
    liquidity: IDL.Nat,
    sqrtPriceX96: IDL.Nat,
    maxLiquidityPerTick: IDL.Nat,
    nextPositionId: IDL.Nat,
  });
  const TokenFees = IDL.Record({ token0Fee: IDL.Nat, token1Fee: IDL.Nat });
  return IDL.Service({
    quote: IDL.Func(
      [SwapArgs],
      [IDL.Variant({ ok: IDL.Nat, err: Error })],
      ['query'],
    ),
    metadata: IDL.Func(
      [],
      [IDL.Variant({ ok: PoolMetadata, err: Error })],
      ['query'],
    ),
    getCachedTokenFee: IDL.Func([], [TokenFees], ['query']),
    depositFromAndSwap: IDL.Func(
      [DepositAndSwapArgs],
      [IDL.Variant({ ok: IDL.Nat, err: Error })],
      [],
    ),
  });
};

const icrc2Idl = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  return IDL.Service({
    icrc2_approve: IDL.Func(
      [IDL.Record({
        spender: Account,
        amount: IDL.Nat,
        fee: IDL.Opt(IDL.Nat),
        memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
        from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        created_at_time: IDL.Opt(IDL.Nat64),
        expected_allowance: IDL.Opt(IDL.Nat),
        expires_at: IDL.Opt(IDL.Nat64),
      })],
      [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Record({}) })],
      [],
    ),
    icrc1_fee: IDL.Func([], [IDL.Nat], ['query']),
  });
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const createMainnetAgent = () =>
  new HttpAgent({ host: IC_HOST, verifyQuerySignatures: false });

const getFactory = (agent) =>
  Actor.createActor(factoryIdl, { agent, canisterId: ICPSWAP_FACTORY_ID });

const getPool = (agent, canisterId) =>
  Actor.createActor(poolIdl, { agent, canisterId });

const getIcrc2 = (agent, canisterId) =>
  Actor.createActor(icrc2Idl, { agent, canisterId });

// Standard order: addresses lexicographic
const sortTokens = (tokenA, tokenB) => {
  const addrA = tokenA.canisterId;
  const addrB = tokenB.canisterId;
  return addrA < addrB
    ? { t0: tokenA, t1: tokenB, zeroForOne: true }
    : { t0: tokenB, t1: tokenA, zeroForOne: false };
};

// ─────────────────────────────────────────────
// Pool lookup
// ─────────────────────────────────────────────
/**
 * Find ICPSwap pool for a token pair.
 * @param {{ canisterId: string, standard?: string }} tokenIn
 * @param {{ canisterId: string, standard?: string }} tokenOut
 * @param {number} fee  — fee tier in basis points * 100 (e.g. 3000 = 0.3%)
 * @returns {{ poolId: string, zeroForOne: boolean } | null}
 */
export const findPool = async (tokenIn, tokenOut, fee = 3000) => {
  try {
    const agent = createMainnetAgent();
    const factory = getFactory(agent);
    const { t0, t1, zeroForOne } = sortTokens(tokenIn, tokenOut);

    const result = await factory.getPool({
      token0: { address: t0.canisterId, standard: t0.standard || 'ICRC1' },
      token1: { address: t1.canisterId, standard: t1.standard || 'ICRC1' },
      fee: BigInt(fee),
    });

    if ('ok' in result) {
      return {
        poolId: result.ok.canisterId.toString(),
        zeroForOne,
        token0: result.ok.token0,
        token1: result.ok.token1,
        fee: Number(result.ok.fee),
      };
    }
    return null;
  } catch (err) {
    console.error('[ICPSwap] findPool error:', err);
    return null;
  }
};

// ─────────────────────────────────────────────
// Quote (price simulation)
// ─────────────────────────────────────────────
/**
 * Get quote: how much tokenOut for amountIn of tokenIn.
 * @param {string}  poolId
 * @param {boolean} zeroForOne  — true: token0 → token1
 * @param {bigint}  amountIn    — in base units
 * @returns {bigint | null}
 */
export const getQuote = async (poolId, zeroForOne, amountIn) => {
  try {
    const agent = createMainnetAgent();
    const pool = getPool(agent, poolId);

    const result = await pool.quote({
      amountIn: amountIn.toString(),
      amountOutMinimum: '0',
      zeroForOne,
    });

    if ('ok' in result) return BigInt(result.ok);
    console.error('[ICPSwap] quote error:', result.err);
    return null;
  } catch (err) {
    console.error('[ICPSwap] getQuote error:', err);
    return null;
  }
};

// ─────────────────────────────────────────────
// Pool token fees (transfer fee cache)
// ─────────────────────────────────────────────
export const getPoolTokenFees = async (poolId) => {
  try {
    const agent = createMainnetAgent();
    const pool = getPool(agent, poolId);
    const fees = await pool.getCachedTokenFee();
    return {
      token0Fee: BigInt(fees.token0Fee),
      token1Fee: BigInt(fees.token1Fee),
    };
  } catch (err) {
    console.error('[ICPSwap] getPoolTokenFees error:', err);
    return { token0Fee: 10000n, token1Fee: 10000n };
  }
};

// ─────────────────────────────────────────────
// Execute swap (depositFromAndSwap)
//
// Flow:
//  1. icrc2_approve(tokenIn ledger, pool canisterId, amountIn + fee)
//  2. pool.depositFromAndSwap(...)
// ─────────────────────────────────────────────
/**
 * Execute swap using ICPSwap's one-step depositFromAndSwap.
 *
 * @param {object} params
 * @param {string}  params.poolId
 * @param {boolean} params.zeroForOne
 * @param {string}  params.tokenInCanisterId   — ledger canister for input token
 * @param {bigint}  params.amountIn            — raw base units
 * @param {bigint}  params.amountOutMinimum    — slippage guard in base units
 * @param {bigint}  params.tokenInFee          — transfer fee for tokenIn
 * @param {bigint}  params.tokenOutFee         — transfer fee for tokenOut
 * @param {object}  params.identity            — DFINITY identity (from AuthClient)
 * @returns {{ success: boolean, amountOut?: bigint, error?: string }}
 */
export const executeSwap = async ({
  poolId,
  zeroForOne,
  tokenInCanisterId,
  amountIn,
  amountOutMinimum,
  tokenInFee,
  tokenOutFee,
  identity,
}) => {
  try {
    const agent = new HttpAgent({ host: IC_HOST, identity, verifyQuerySignatures: false });

    // Step 1: Approve pool to spend tokenIn
    const tokenAct = getIcrc2(agent, tokenInCanisterId);
    const approveAmount = amountIn + tokenInFee;

    const approveResult = await tokenAct.icrc2_approve({
      spender: { owner: Principal.fromText(poolId), subaccount: [] },
      amount: approveAmount,
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      expected_allowance: [],
      expires_at: [],
    });

    if ('Err' in approveResult) {
      return { success: false, error: `Approve failed: ${JSON.stringify(approveResult.Err)}` };
    }

    // Step 2: depositFromAndSwap
    const poolAct = getPool(agent, poolId);
    const swapResult = await poolAct.depositFromAndSwap({
      amountIn: amountIn.toString(),
      amountOutMinimum: amountOutMinimum.toString(),
      zeroForOne,
      tokenInFee,
      tokenOutFee,
    });

    if ('ok' in swapResult) {
      return { success: true, amountOut: BigInt(swapResult.ok) };
    }
    return { success: false, error: JSON.stringify(swapResult.err) };
  } catch (err) {
    console.error('[ICPSwap] executeSwap error:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
};

// ─────────────────────────────────────────────
// Popular ICP pairs with fee tiers
// ─────────────────────────────────────────────
export const SWAP_PAIRS = [
  // ICP canister: ryjl3-tyaaa-aaaaa-aaaba-cai (ICP ledger uses "ICP" standard in ICPSwap)
  { from: 'ICP',   to: 'ckBTC',  fee: 3000 },
  { from: 'ICP',   to: 'ckETH',  fee: 3000 },
  { from: 'ICP',   to: 'ckUSDT', fee: 3000 },
  { from: 'ckBTC', to: 'ckETH',  fee: 3000 },
  { from: 'ckBTC', to: 'ckUSDT', fee: 3000 },
  { from: 'ckETH', to: 'ckUSDT', fee: 3000 },
];

// Token standard overrides for ICPSwap (ICP ledger uses "ICP" not "ICRC1")
export const ICPSWAP_TOKEN_STANDARDS = {
  'ryjl3-tyaaa-aaaaa-aaaba-cai': 'ICP',
  'mxzaz-hqaaa-aaaar-qaada-cai': 'ICRC2',  // ckBTC
  'ss2fx-dyaaa-aaaar-qacoq-cai': 'ICRC2',  // ckETH
  'cngnf-vqaaa-aaaar-qag4q-cai': 'ICRC2',  // ckUSDT
};

export const getTokenStandard = (canisterId) =>
  ICPSWAP_TOKEN_STANDARDS[canisterId] || 'ICRC2';
