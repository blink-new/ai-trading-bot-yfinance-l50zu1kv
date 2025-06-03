import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - replace with your actual Supabase URL and anon key if they are not auto-injected
// Ensure these are available as environment variables in your Vite project (e.g., VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env file or environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const currencyPairs = [
  "eur.usd",
  "eur.jpy",
  "usd.chf",
  "eur.cad",
  "aud.usd",
];

const timeframes = ["1m", "3m", "5m"];

interface SignalData {
  pair: string;
  lastPrice: number | null;
  sma: number | null;
  rsi: number | null;
  macd: number | null;
  boll: { upper: number; lower: number; sma: number } | null;
  stochastic: number | null;
  signal: { signal: string; confidence: number };
}

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(currencyPairs[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[0]);
  const [data, setData] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchDataAndSignal() {
    if (!supabaseUrl || !supabaseAnonKey) {
      setError("Supabase not configured. Cannot fetch data.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    try {
      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        "yfinance",
        {
          body: { pair: selectedPair, timeframe: selectedTimeframe },
        }
      );

      if (functionError) {
        throw new Error(`Supabase function error: ${functionError.message}`);
      }
      
      if (responseData.error) {
        throw new Error(`Data fetching error: ${responseData.error}`);
      }

      setData(responseData as SignalData);
    } catch (e) {
      console.error("Fetch error:", e);
      setError((e as Error).message || "Failed to fetch data and signal.");
    }
    setLoading(false);
  }

  useEffect(() => {
    // Fetch data on initial load
    fetchDataAndSignal();
  }, [selectedPair, selectedTimeframe]);

  return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl text-slate-100">
      <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
        AI Trading Signal Bot
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="pair" className="block font-medium mb-2 text-sky-300">
            Currency Pair
          </label>
          <select
            id="pair"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all duration-150"
          >
            {currencyPairs.map((pair) => (
              <option key={pair} value={pair} className="bg-slate-800">
                {pair.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timeframe" className="block font-medium mb-2 text-sky-300">
            Timeframe
          </label>
          <select
            id="timeframe"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-100 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all duration-150"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf} className="bg-slate-800">
                {tf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 p-6 bg-slate-800 rounded-lg shadow-md min-h-[200px] flex flex-col justify-center">
        <h2 className="text-xl font-semibold mb-4 text-sky-400">Trading Signal & Data</h2>
        {loading && (
          <div className="flex items-center justify-center text-sky-400">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching latest data...
          </div>
        )}
        {error && <p className="text-red-400 text-center">Error: {error}</p>}
        {!loading && !error && data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">Signal:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${data.signal.signal === "Buy"
                    ? "bg-green-500 text-green-900"
                    : data.signal.signal === "Sell"
                    ? "bg-red-500 text-red-900"
                    : "bg-yellow-500 text-yellow-900"
                  }`}
              >
                {data.signal.signal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">Confidence:</span>
              <span className="text-sky-300">{(data.signal.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">Last Price:</span>
              <span className="text-sky-300">{data.lastPrice?.toFixed(5) ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">RSI (14):</span>
              <span className="text-sky-300">{data.rsi?.toFixed(2) ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">MACD:</span>
              <span className="text-sky-300">{data.macd?.toFixed(4) ?? 'N/A'}</span>
            </div>
             <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">Stochastic (14):</span>
              <span className="text-sky-300">{data.stochastic?.toFixed(2) ?? 'N/A'}</span>
            </div>
          </div>
        )}
        {!loading && !error && !data && (
            <p className="text-slate-400 text-center">Select pair and timeframe, then refresh.</p>
        )}
      </div>

      <Button 
        onClick={fetchDataAndSignal} 
        disabled={loading || !supabaseUrl || !supabaseAnonKey}
        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing...
          </>
        ) : "Refresh Data & Signal"}
      </Button>
      {(!supabaseUrl || !supabaseAnonKey) && 
        <p className="text-xs text-red-400 mt-2 text-center">Supabase URL/Key missing. App may not function correctly.</p>}
    </div>
  );
}