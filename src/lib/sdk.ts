/**
 * NAVI SDK wrapper.
 *
 * Uses official NAVI public API (https://open-api.naviprotocol.io/api/navi/pools)
 * to fetch pool data. This avoids SDK version issues and provides correct scaling.
 */

import BigNumber from 'bignumber.js';
import { POOL_CONFIGS } from './constants';
import { calcUtilization } from './pools';

const NAVI_API_URL = 'https://open-api.naviprotocol.io/api/navi/pools';

export interface NaviPoolData {
  symbol: string;
  poolId: number;
  coinType: string;
  totalSupply: number;       // human-readable token amount
  totalSupplyUsd: number;
  totalBorrows: number;      // human-readable token amount
  totalBorrowsUsd: number;
  availableLiquidity: number;
  availableLiquidityUsd: number;
  supplyApy: number;         // percentage
  borrowApy: number;         // percentage
  utilization: number;       // percentage
  ltv: number;               // percentage
  liquidationThreshold: number;
  supplyCapCeiling: number;
  borrowCapCeiling: number;
  price: number;
  rateModel?: {
    baseRate: number;
    multiplier: number;
    jumpMultiplier: number;
    kink: number;
    reserveFactor: number;
  };
}

/**
 * Fetch all pool data from NAVI API.
 */
export async function fetchAllPools(): Promise<NaviPoolData[]> {
  const pools: NaviPoolData[] = [];

  try {
    const res = await fetch(NAVI_API_URL, { next: { revalidate: 60 } }); // Cache for 60s
    if (!res.ok) throw new Error(`NAVI API error: ${res.statusText}`);

    const rawResponse = await res.json();
    const rawPools: any[] = rawResponse.data || [];

    // rawPools is an array of pool objects
    for (const p of rawPools) {
      // Find matching config by CoinType or Symbol
      const poolId = Number(p.id);
      let config = Object.values(POOL_CONFIGS).find(
        (c) => c.poolId === poolId
      );

      if (!config) continue;

      // Scaling logic per NAVI docs/SDK source:
      // Total Supply = (raw_total_supply / 1e9) * (current_supply_index / 1e27)
      // Total Borrow = (raw_total_borrow / 1e9) * (current_borrow_index / 1e27)
      // Note: raw_total_supply IS already scaled by 1e9 in some contexts?
      // User instruction: "totalSupply / 1e9 * supplyIndex"

      const rawSupply = new BigNumber(p.totalSupply || 0);
      const supplyIndex = new BigNumber(p.currentSupplyIndex || 0);
      const rawBorrow = new BigNumber(p.totalBorrow || 0);
      const borrowIndex = new BigNumber(p.currentBorrowIndex || 0);

      // Using user provided formula:
      // (raw / 1e9) * (index / 1e27)
      // If index is 1e27 based (Ray).

      const totalSupply = rawSupply
        .dividedBy(1e9)
        .multipliedBy(supplyIndex.dividedBy(1e27))
        .toNumber();

      const totalBorrows = rawBorrow
        .dividedBy(1e9)
        .multipliedBy(borrowIndex.dividedBy(1e27))
        .toNumber();

      // Price from API directly (Fallback to oracle if token price is 0/missing)
      let price = Number(p.token?.price || 0);
      if (!price && p.oracle?.price) {
        price = Number(p.oracle.price);
      }

      // APY from API directly
      const supplyApy = Number(p.supplyIncentiveApyInfo?.apy || 0);
      const borrowApy = Number(p.borrowIncentiveApyInfo?.apy || 0);

      // Caps from API
      // User said: "caps all divided by 1e27"
      // Wait, is Supply Cap scaled by 1e9 or 1e27? 
      // Usually caps are raw generic units (1e9).
      // But user said "caps ... divided by 1e27". I will try that.
      // If cap is 1e36 range (like 920000...000 in sample), dividing by 1e27 gives 1e9 range (Billions). Valid.

      const supplyCap = new BigNumber(String(p.supplyCapCeiling || 0)).dividedBy(1e27).toNumber();
      const borrowCap = new BigNumber(String(p.borrowCapCeiling || 0)).dividedBy(1e27).toNumber();

      let rateModel;
      if (p.borrowRateFactors?.fields) {
        const fields = p.borrowRateFactors.fields;
        rateModel = {
          baseRate: new BigNumber(fields.baseRate || 0).dividedBy(1e27).toNumber(),
          multiplier: new BigNumber(fields.multiplier || 0).dividedBy(1e27).toNumber(),
          jumpMultiplier: new BigNumber(fields.jumpRateMultiplier || 0).dividedBy(1e27).toNumber(),
          kink: new BigNumber(fields.optimalUtilization || 0).dividedBy(1e27).toNumber(),
          reserveFactor: new BigNumber(fields.reserveFactor || 0).dividedBy(1e27).toNumber(),
        };
      }

      pools.push({
        symbol: config.symbol,
        poolId,
        coinType: config.coinType,
        totalSupply,
        totalSupplyUsd: totalSupply * price,
        totalBorrows,
        totalBorrowsUsd: totalBorrows * price,
        availableLiquidity: totalSupply - totalBorrows,
        availableLiquidityUsd: (totalSupply - totalBorrows) * price,
        supplyApy,
        borrowApy,
        utilization: calcUtilization(totalSupply, totalBorrows),
        ltv: Number(p.ltvValue || 0) * 100,
        liquidationThreshold: Number(p.liquidationFactor?.threshold || 0) * 100,
        supplyCapCeiling: supplyCap,
        borrowCapCeiling: borrowCap,
        price,
        rateModel,
      });
    }
  } catch (error) {
    console.error('NAVI API fetchAllPools error:', error);
  }

  return pools;
}

/**
 * Fetch a single pool by symbol (using cached all pools).
 */
export async function fetchSinglePool(
  symbol: string
): Promise<NaviPoolData | null> {
  const all = await fetchAllPools();
  return all.find((p) => p.symbol === symbol) ?? null;
}
