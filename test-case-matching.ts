import { POOL_SYMBOLS, POOL_CONFIGS } from './src/lib/constants';

function findRealSymbol(urlSymbol: string): string {
  const upper = urlSymbol.toUpperCase();
  return POOL_SYMBOLS.find(s => s.toUpperCase() === upper) || upper;
}

console.log("hasui ->", findRealSymbol("hasui"));
console.log("enzobtc ->", findRealSymbol("enzobtc"));
console.log("sui ->", findRealSymbol("sui"));
console.log("Wbtc ->", findRealSymbol("Wbtc"));
