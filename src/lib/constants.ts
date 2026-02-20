// ─── NAVI Protocol Constants ────────────────────────────────────────────────

export const NAVI_LENDING_PACKAGE =
  '0x1e4a13a0494d5facdbe8473e74127b838c2d446ecec0ce262e2eddafa77259cb';

export const NAVI_EVENT_TYPES = {
  DEPOSIT: `${NAVI_LENDING_PACKAGE}::event::DepositEvent`,
  WITHDRAW: `${NAVI_LENDING_PACKAGE}::event::WithdrawEvent`,
  BORROW: `${NAVI_LENDING_PACKAGE}::event::BorrowEvent`,
  REPAY: `${NAVI_LENDING_PACKAGE}::event::RepayEvent`,
  LIQUIDATION_CALL: `${NAVI_LENDING_PACKAGE}::event::LiquidationCallEvent`,
  LIQUIDATION: `${NAVI_LENDING_PACKAGE}::event::LiquidationEvent`,
  STATE_UPDATED: `${NAVI_LENDING_PACKAGE}::event::StateUpdated`,
} as const;

// ─── Pool Configurations ────────────────────────────────────────────────────

export interface PoolConfig {
  poolId: number;
  coinType: string;
  decimals: number;
  symbol: string;
  name: string;
  color: string;
}

export const POOL_CONFIGS: Record<string, PoolConfig> = {
  SUI: {
    poolId: 0,
    coinType: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    decimals: 9,
    symbol: 'SUI',
    name: 'Sui',
    color: '#3498DB',
  },
  wUSDC: {
    poolId: 1,
    coinType: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    decimals: 6,
    symbol: 'wUSDC',
    name: 'Wormhole USDC',
    color: '#2775CA',
  },
  wUSDT: {
    poolId: 2,
    coinType: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    decimals: 6,
    symbol: 'wUSDT',
    name: 'Wormhole USDT',
    color: '#26A17B',
  },
  WETH: {
    poolId: 3,
    coinType: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    decimals: 8,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    color: '#627EEA',
  },
  CETUS: {
    poolId: 4,
    coinType: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    decimals: 9,
    symbol: 'CETUS',
    name: 'Cetus',
    color: '#2E67F8',
  },
  vSUI: {
    poolId: 5,
    coinType: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
    decimals: 9,
    symbol: 'vSUI',
    name: 'Volo Staked SUI',
    color: '#9945FF',
  },
  haSUI: {
    poolId: 6,
    coinType: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
    decimals: 9,
    symbol: 'haSUI',
    name: 'Haedal Staked SUI',
    color: '#00D4AA',
  },
  NAVX: {
    poolId: 7,
    coinType: '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX',
    decimals: 9,
    symbol: 'NAVX',
    name: 'NAVI Token',
    color: '#FF6B35',
  },
  USDC: {
    poolId: 10,
    coinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    decimals: 6,
    symbol: 'USDC',
    name: 'Native USDC',
    color: '#2775CA',
  },
  DEEP: {
    poolId: 15,
    coinType: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    decimals: 6,
    symbol: 'DEEP',
    name: 'DeepBook Token',
    color: '#2C3E50',
  },
  BUCK: {
    poolId: 18,
    coinType: '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK',
    decimals: 9,
    symbol: 'BUCK',
    name: 'Bucket USD',
    color: '#F1C40F',
  },
  suiUSDT: {
    poolId: 19,
    coinType: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
    decimals: 6,
    symbol: 'suiUSDT',
    name: 'Sui Bridge USDT',
    color: '#1ABC9C',
  },
  wBTC: {
    poolId: 21,
    coinType: '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC',
    decimals: 8,
    symbol: 'wBTC',
    name: 'Wrapped Bitcoin',
    color: '#F39C12',
  },
  xBTC: {
    poolId: 26,
    coinType: '0x876a4b7bce8aeaef60464c11f4026903e9afacab79b9b142686158aa86560b50::xbtc::XBTC',
    decimals: 8,
    symbol: 'xBTC',
    name: 'Cross-chain BTC',
    color: '#E67E22',
  },
  enzoBTC: {
    poolId: 28,
    coinType: '0x8f2b5eb696ed88b71fea398d330bccfa52f6e2a5a8e1ac6180fcb25c6de42ebc::coin::COIN',
    decimals: 8,
    symbol: 'enzoBTC',
    name: 'Enzo BTC',
    color: '#D35400',
  },
  MBTC: {
    poolId: 29,
    coinType: '0xd1a91b46bd6d966b62686263609074ad16cfdffc63c31a4775870a2d54d20c6b::mbtc::MBTC',
    decimals: 8,
    symbol: 'MBTC',
    name: 'Multi-chain BTC',
    color: '#E74C3C',
  },
  suiUSDe: {
    poolId: 33,
    coinType: '0x41d587e5336f1c86cad50d38a7136db99333bb9bda91cea4ba69115defeb1402::sui_usde::SUI_USDE',
    decimals: 6,
    symbol: 'suiUSDe',
    name: 'suiUSDe',
    color: '#808080',
  },
  WBTC_32: {
    poolId: 32,
    coinType: '0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC',
    decimals: 8,
    symbol: 'WBTC', // Same symbol, different ID for UI display later if merged
    name: 'WBTC',
    color: '#808080',
  },
  XAUM: {
    poolId: 31,
    coinType: '0x9d297676e7a4b771ab023291377b2adfaa4938fb9080b8d12430e4b108b836a9::xaum::XAUM',
    decimals: 9,
    symbol: 'XAUM',
    name: 'XAUM',
    color: '#808080',
  },
  'YBTC.B': {
    poolId: 30,
    coinType: '0xa03ab7eee2c8e97111977b77374eaf6324ba617e7027382228350db08469189e::ybtc::YBTC',
    decimals: 8,
    symbol: 'YBTC.B',
    name: 'YBTC.B',
    color: '#808080',
  },
  IKA: {
    poolId: 27,
    coinType: '0x7262fb2f7a3a14c888c438a3cd9b912469a58cf60f367352c46584262e8299aa::ika::IKA',
    decimals: 9,
    symbol: 'IKA',
    name: 'IKA',
    color: '#808080',
  },
  HAEDAL: {
    poolId: 25,
    coinType: '0x3a304c7feba2d819ea57c3542d68439ca2c386ba02159c740f7b406e592c62ea::haedal::HAEDAL',
    decimals: 9,
    symbol: 'HAEDAL',
    name: 'HAEDAL',
    color: '#808080',
  },
  WAL: {
    poolId: 24,
    coinType: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
    decimals: 9,
    symbol: 'WAL',
    name: 'WAL',
    color: '#808080',
  },
  LBTC: {
    poolId: 23,
    coinType: '0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC',
    decimals: 8,
    symbol: 'LBTC',
    name: 'LBTC',
    color: '#808080',
  },
  SOL: {
    poolId: 22,
    coinType: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
    decimals: 8,
    symbol: 'SOL',
    name: 'SOL',
    color: '#808080',
  },
  stSUI: {
    poolId: 20,
    coinType: '0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI',
    decimals: 9,
    symbol: 'stSUI',
    name: 'stSUI',
    color: '#808080',
  },
  BLUE: {
    poolId: 17,
    coinType: '0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE',
    decimals: 9,
    symbol: 'BLUE',
    name: 'BLUE',
    color: '#808080',
  },
  FDUSD: {
    poolId: 16,
    coinType: '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD',
    decimals: 6,
    symbol: 'FDUSD',
    name: 'FDUSD',
    color: '#808080',
  },
  stBTC: {
    poolId: 14,
    coinType: '0x5f496ed5d9d045c5b788dc1bb85f54100f2ede11e46f6a232c29daada4c5bdb6::coin::COIN',
    decimals: 8,
    symbol: 'stBTC',
    name: 'stBTC',
    color: '#808080',
  },
  NS: {
    poolId: 13,
    coinType: '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS',
    decimals: 6,
    symbol: 'NS',
    name: 'NS',
    color: '#808080',
  },
  USDY: {
    poolId: 12,
    coinType: '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY',
    decimals: 6,
    symbol: 'USDY',
    name: 'USDY',
    color: '#808080',
  },
  suiETH: {
    poolId: 11,
    coinType: '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH',
    decimals: 8,
    symbol: 'suiETH',
    name: 'suiETH',
    color: '#808080',
  },
  AUSD: {
    poolId: 9,
    coinType: '0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD',
    decimals: 6,
    symbol: 'AUSD',
    name: 'AUSD',
    color: '#808080',
  },
  WBTC_8: {
    poolId: 8,
    coinType: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    decimals: 8,
    symbol: 'WBTC', // Same symbol, different ID for UI display later if merged
    name: 'WBTC',
    color: '#808080',
  },
};

export const POOL_ID_TO_SYMBOL: Record<number, string> = Object.fromEntries(
  Object.values(POOL_CONFIGS).map((c) => [c.poolId, c.symbol])
);

export const POOL_SYMBOLS = Object.keys(POOL_CONFIGS);

// ─── Rate Constants ─────────────────────────────────────────────────────────

export const RATE_SCALE = '1000000000000000000000000000'; // 1e27

// ─── Health Factor Colors ───────────────────────────────────────────────────

export function healthFactorColor(hf: number): string {
  if (hf < 1.0) return '#EF4444'; // red — liquidatable
  if (hf < 1.2) return '#F97316'; // orange — critical
  if (hf < 1.5) return '#EAB308'; // yellow — warning
  return '#22C55E'; // green — safe
}

export function healthFactorLabel(hf: number): string {
  if (hf < 1.0) return 'Liquidatable';
  if (hf < 1.2) return 'Critical';
  if (hf < 1.5) return 'Warning';
  return 'Safe';
}

// ─── Cron Auth ──────────────────────────────────────────────────────────────

export const CRON_SECRET = process.env.CRON_SECRET ?? 'dev-secret';
