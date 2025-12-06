import { hmacSha256 } from '../utils/crypto';
import { AccountInfo, BinanceCreds, KlineData, OrderParams, OrderResponse } from '../types';

const DIRECT_BASE_URL = 'https://api.binance.com';
const LOCAL_PROXY_PATH = '/api-proxy'; // Matches vite.config.ts
const BASE_WS_URL = 'wss://stream.binance.com:9443';

// Mock data for demo mode - UPDATED to ~2024 Prices
export const MOCK_ACCOUNT_INFO: AccountInfo = {
  makerCommission: 10,
  takerCommission: 10,
  buyerCommission: 0,
  sellerCommission: 0,
  canTrade: true,
  canWithdraw: true,
  canDeposit: true,
  updateTime: 123456789,
  accountType: 'SPOT',
  balances: [
    { asset: 'BTC', free: '0.0045', locked: '0.0' }, // ~$400
    { asset: 'ETH', free: '0.5', locked: '0.0' },   // ~$1500
    { asset: 'USDT', free: '1240.00', locked: '100.00' },
    { asset: 'BNB', free: '1.2', locked: '0.0' },
    { asset: 'SOL', free: '15.0', locked: '0.0' },
  ]
};

// Updated mock history to generate realistic prices (BTC ~92k, ETH ~3k)
export const generateMockHistory = (basePrice: number, count: number = 24): KlineData[] => {
    const data: KlineData[] = [];
    let currentPrice = basePrice;
    const now = Date.now();
    for(let i = count; i >= 0; i--) {
        const time = now - (i * 3600 * 1000); // Hourly
        // Random walk
        const change = (Math.random() - 0.5) * (basePrice * 0.02); 
        const close = currentPrice + change;
        const open = currentPrice;
        const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
        const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
        
        data.push({ time, open, high, low, close });
        currentPrice = close;
    }
    return data;
};

export class BinanceService {
  private creds: BinanceCreds | null = null;
  private ws: WebSocket | null = null;
  private timeOffset: number = 0; // Difference between local time and server time

  constructor(creds?: BinanceCreds) {
    if (creds) {
      this.creds = creds;
    }
  }

  private getBaseUrl(endpoint: string): string {
    if (this.creds?.proxyUrl === 'LOCAL_PROXY') {
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${LOCAL_PROXY_PATH}${path}`;
    } else if (this.creds?.proxyUrl && this.creds.proxyUrl.startsWith('http')) {
        const targetUrl = `${DIRECT_BASE_URL}${endpoint}`;
        return `${this.creds.proxyUrl}${encodeURIComponent(targetUrl)}`;
    } else {
        return `${DIRECT_BASE_URL}${endpoint}`;
    }
  }

  async syncTime(): Promise<void> {
    try {
        const url = this.getBaseUrl('/api/v3/time');
        const res = await fetch(url);
        const data = await res.json();
        const serverTime = data.serverTime;
        const localTime = Date.now();
        this.timeOffset = serverTime - localTime;
        console.log(`[BinanceService] Time Synced. Offset: ${this.timeOffset}ms`);
    } catch (e) {
        console.warn("[BinanceService] Failed to sync time, defaulting to local time.", e);
        this.timeOffset = 0;
    }
  }

  connectTickerStream(symbols: string[], onMessage: (data: any) => void) {
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
    const url = `${BASE_WS_URL}/stream?streams=${streams}`;

    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const payload = msg.data || msg;
        onMessage(payload);
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };
    return () => { if (this.ws) this.ws.close(); };
  }

  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.creds) throw new Error("No credentials provided");

    if (this.timeOffset === 0) {
        await this.syncTime();
    }

    const endpoint = '/api/v3/account';
    const timestamp = Date.now() + this.timeOffset;
    const queryString = `timestamp=${timestamp}&recvWindow=10000`;

    const signature = await hmacSha256(this.creds.apiSecret, queryString);
    const fullQuery = `${queryString}&signature=${signature}`;
    
    const fetchUrl = `${this.getBaseUrl(endpoint)}?${fullQuery}`;

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.creds.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) await this.handleError(response);

      return await response.json();
    } catch (error: any) {
      console.error("[BinanceService] Fetch Account failed:", error);
      throw error;
    }
  }

  async getHistoricalPrices(symbol: string, interval: string = '1h', limit: number = 24): Promise<KlineData[]> {
    const endpoint = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const url = this.getBaseUrl(endpoint);
    
    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error("Failed to fetch klines");
        const raw = await res.json();
        if(!Array.isArray(raw)) return [];
        
        return raw.map((k: any) => ({
            time: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4])
        }));
    } catch(e) {
        console.error("History fetch error", e);
        return [];
    }
  }

  /**
   * Execute a Trade (Buy/Sell)
   * API Docs: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints
   */
  async placeOrder(params: OrderParams): Promise<OrderResponse> {
    if (!this.creds) throw new Error("No credentials provided");

    if (this.timeOffset === 0) await this.syncTime();

    const endpoint = '/api/v3/order';
    const timestamp = Date.now() + this.timeOffset;
    
    let queryArgs: string[] = [
        `symbol=${params.symbol}`,
        `side=${params.side}`,
        `type=${params.type}`,
        `quantity=${params.quantity}`,
        `timestamp=${timestamp}`,
        `recvWindow=10000`
    ];

    if (params.type === 'LIMIT') {
        if(!params.price) throw new Error("Price is required for LIMIT orders");
        queryArgs.push(`price=${params.price}`);
        queryArgs.push(`timeInForce=${params.timeInForce || 'GTC'}`);
    }

    const queryString = queryArgs.join('&');
    const signature = await hmacSha256(this.creds.apiSecret, queryString);
    const fullQuery = `${queryString}&signature=${signature}`;
    
    const fetchUrl = `${this.getBaseUrl(endpoint)}?${fullQuery}`;

    console.log(`[BinanceService] Placing Order: ${params.side} ${params.symbol} ${params.quantity} @ ${params.price || 'MARKET'}`);

    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'X-MBX-APIKEY': this.creds.apiKey,
                'Content-Type': 'application/x-www-form-urlencoded' // Orders often require form-urlencoded or json with params in query
            }
        });

        if (!response.ok) await this.handleError(response);

        return await response.json();
    } catch (error) {
        console.error("[BinanceService] Order failed:", error);
        throw error;
    }
  }

  private async handleError(response: Response) {
      const errText = await response.text();
      let errMsg = `Error ${response.status}`;
      try {
          const errJson = JSON.parse(errText);
          if (errJson.code === -1021) errMsg = "Timestamp Error: System clock unsynced.";
          else if (errJson.code === -2010) errMsg = "Order Rejected: Insufficient balance or invalid params.";
          else if (errJson.code === -2014) errMsg = "API Key Invalid or Format Wrong.";
          else if (errJson.code === -2015) errMsg = "API Key or IP restricted.";
          else errMsg = `Binance Error (${errJson.code}): ${errJson.msg}`;
      } catch (e) {
          // If the response is not JSON (likely an HTML error from the proxy)
          if (response.status === 504 || response.status === 502) {
             errMsg = "Proxy Connection Failed: Local server could not reach Binance. Try 'Public Proxy' mode.";
          } else {
             errMsg = `Network Error (${response.status}): ${errText.substring(0, 50)}`;
          }
      }
      throw new Error(errMsg);
  }
}