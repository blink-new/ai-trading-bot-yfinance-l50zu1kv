import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

const currencyPairs = [
  "eur.usd",
  "eur.jpy",
  "usd.chf",
  "eur.cad",
  "aud.usd",
];

const timeframes = ["1m", "3m", "5m"];

const dummySignals = {
  "eur.usd": { signal: "Buy", confidence: 0.87 },
  "eur.jpy": { signal: "Sell", confidence: 0.65 },
  "usd.chf": { signal: "Buy", confidence: 0.72 },
  "eur.cad": { signal: "Sell", confidence: 0.55 },
  "aud.usd": { signal: "Buy", confidence: 0.80 },
};

export default function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState(currencyPairs[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[0]);
  const [signal, setSignal] = useState(dummySignals[selectedPair]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulate fetching signal for selected pair
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      if (dummySignals[selectedPair]) {
        setSignal(dummySignals[selectedPair]);
        setLoading(false);
      } else {
        setError("No signal data available for this pair.");
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedPair]);

  function handleRetrain() {
    setLoading(true);
    setError("");
    // Simulate retrain delay
    setTimeout(() => {
      setLoading(false);
      alert("Model retrained successfully (simulated).");
    }, 1500);
  }

  return (
    <div className="max-w-screen-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold mb-6 text-center">AI Trading Bot Dashboard</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <label htmlFor="pair" className="block font-medium mb-1">
            Select Currency Pair
          </label>
          <select
            id="pair"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-48"
          >
            {currencyPairs.map((pair) => (
              <option key={pair} value={pair}>
                {pair.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timeframe" className="block font-medium mb-1">
            Select Timeframe
          </label>
          <select
            id="timeframe"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-full sm:w-32"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Price Chart (Placeholder)</h2>
        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
          Chart will be displayed here.
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Trading Signal</h2>
        {loading ? (
          <p className="text-blue-600">Loading signal...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="flex items-center gap-4">
            <span
              className={`px-4 py-2 rounded-md font-semibold text-white ${
                signal.signal === "Buy" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {signal.signal}
            </span>
            <span>Confidence: {(signal.confidence * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <Button onClick={handleRetrain} disabled={loading} className="w-full">
        {loading ? "Processing..." : "Retrain Model"}
      </Button>
    </div>
  );
}
