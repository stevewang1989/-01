
export interface BinanceCreds {
  apiKey: string;
  apiSecret: string;
  proxyUrl?: string;
}

export interface AssetBalance {
  asset: string;
  free: string;
  locked: string;
  btcValuation?: number; // Estimated value in BTC
  usdtValuation?: number; // Estimated value in USDT
}

export interface TickerData {
  s: string; // Symbol (e.g., BTCUSDT)
  c: string; // Current Price
  p: string; // Price Change
  P: string; // Price Change Percent
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: AssetBalance[];
}

export enum AppState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

// Trading Types
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET';

export interface OrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  price?: string; // Required for LIMIT
  timeInForce?: 'GTC' | 'IOC' | 'FOK'; // Required for LIMIT, default GTC
}

export interface OrderResponse {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
}
