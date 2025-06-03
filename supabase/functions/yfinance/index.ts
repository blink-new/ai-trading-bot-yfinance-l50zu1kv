// Supabase Edge Function: yfinance data fetcher
// This function fetches real-time forex data for a given pair and timeframe using a public Yahoo Finance endpoint (no API key required)
// Returns: last price, RSI, MACD, Bollinger Bands, Moving Averages, Stochastic

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function getYahooSymbol(pair: string) {
  // Map forex pair to Yahoo symbol (e.g. EURUSD=X)
  return pair.replace(".", "").toUpperCase() + "=X";
}

async function fetchYahooData(symbol: string, interval: string) {
  // Yahoo Finance endpoint for historical data
  // Example: https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1m&range=1d
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=1d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch Yahoo Finance data");
  const data = await res.json();
  return data;
}

function calcSMA(values: number[], period: number) {
  if (values.length < period) return null;
  const sma = values.slice(-period).reduce((a, b) => a + b, 0) / period;
  return sma;
}

function calcRSI(values: number[], period = 14) {
  if (values.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (gains + losses === 0) return 50;
  const rs = gains / (losses || 1e-9);
  return 100 - 100 / (1 + rs);
}

function calcMACD(values: number[]) {
  // MACD = EMA(12) - EMA(26), Signal = EMA(9) of MACD
  function ema(period: number) {
    const k = 2 / (period + 1);
    let emaPrev = values[0];
    for (let i = 1; i < values.length; i++) {
      emaPrev = values[i] * k + emaPrev * (1 - k);
    }
    return emaPrev;
  }
  const macd = ema(12) - ema(26);
  return macd;
}

function calcBollinger(values: number[], period = 20) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + (b - sma) ** 2, 0) / period);
  return { upper: sma + 2 * std, lower: sma - 2 * std, sma };
}

function calcStochastic(values: number[], period = 14) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  const close = values[values.length - 1];
  return ((close - low) / (high - low)) * 100;
}

function generateSignal({ rsi, macd, stochastic }: { rsi: number|null, macd: number|null, stochastic: number|null }) {
  // Simple logic: Buy if RSI < 35, MACD > 0, Stochastic < 20; Sell if RSI > 65, MACD < 0, Stochastic > 80
  if (rsi !== null && macd !== null && stochastic !== null) {
    if (rsi < 35 && macd > 0 && stochastic < 20) return { signal: "Buy", confidence: 0.85 };
    if (rsi > 65 && macd < 0 && stochastic > 80) return { signal: "Sell", confidence: 0.85 };
    if (macd > 0) return { signal: "Buy", confidence: 0.6 };
    if (macd < 0) return { signal: "Sell", confidence: 0.6 };
  }
  return { signal: "Hold", confidence: 0.5 };
}

serve(async (req) => {
  try {
    const { pair = "eur.usd", timeframe = "1m" } = Object.fromEntries(new URL(req.url).searchParams.entries());
    const symbol = getYahooSymbol(pair);
    const interval = timeframe;
    const data = await fetchYahooData(symbol, interval);
    const closes = data.chart.result[0].indicators.quote[0].close.filter((v: number) => v !== null);
    const lastPrice = closes[closes.length - 1];
    const sma = calcSMA(closes, 20);
    const rsi = calcRSI(closes);
    const macd = calcMACD(closes);
    const boll = calcBollinger(closes);
    const stochastic = calcStochastic(closes);
    const signal = generateSignal({ rsi, macd, stochastic });
    return new Response(
      JSON.stringify({
        pair,
        lastPrice,
        sma,
        rsi,
        macd,
        boll,
        stochastic,
        signal,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
