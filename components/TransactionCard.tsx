import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';

interface Transaction {
  time: number;
  amount: number;
  tx_id: string;
}

interface FirebaseData {
  apple: { x: number; y: number };
  direction: { x: number; y: number };
  processed_txs: {
    [key: string]: Transaction;
  };
}

const FlowerDecoration = () => (
  <svg
    className="absolute top-0 left-0 w-full h-28 pointer-events-none overflow-visible z-0"
    viewBox="0 0 400 112"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Improved Decorative Vines */}
    <path
      d="M0,45 Q100,15 200,45 T400,45"
      fill="none"
      stroke="#4A5568"
      strokeWidth="1.5"
      opacity="0.2"
    />
    <path
      d="M0,55 Q100,85 200,55 T400,55"
      fill="none"
      stroke="#4A5568"
      strokeWidth="1.5"
      opacity="0.2"
    />

    {/* Top Left Flower - Repositioned and Scaled */}
    <g transform="translate(45, 30) scale(0.8)" className="text-rose-500">
      <path
        d="M0,0 C5,-5 10,-5 15,0 C20,-5 25,-5 30,0 C15,15 0,15 0,0"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M15,-5 C20,-10 25,-10 30,-5 C35,-10 40,-10 45,-5 C30,10 15,10 15,-5"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M10,5 C15,0 20,0 25,5 C30,0 35,0 40,5 C25,20 10,20 10,5"
        fill="currentColor"
        opacity="0.4"
      />
    </g>

    {/* Top Right Flower - Adjusted Position and Rotation */}
    <g transform="translate(350, 25) rotate(15) scale(0.7)" className="text-purple-400">
      <path d="M0,0 Q10,-10 20,0 Q10,10 0,0" fill="currentColor" opacity="0.7" />
      {[72, 144, 216, 288].map((rotation) => (
        <path
          key={`petal-${rotation}`}
          d="M-5,0 Q5,-10 15,0 Q5,10 -5,0"
          fill="currentColor"
          opacity="0.5"
          transform={`rotate(${rotation})`}
        />
      ))}
    </g>

    {/* Distributed Small Flowers */}
    {[
      { x: 120, y: 65 },
      { x: 200, y: 80 },
      { x: 280, y: 60 },
      { x: 160, y: 40 },
      { x: 240, y: 35 }
    ].map((pos, i) => (
      <g key={`small-flower-${i}`} transform={`translate(${pos.x}, ${pos.y}) scale(0.8)`}>
        <circle r="3" fill="#EC4899" opacity="0.5" />
        <circle r="2" fill="#EC4899" opacity="0.4" transform="translate(0, -4)" />
        <circle r="2" fill="#EC4899" opacity="0.4" transform="translate(-3.5, 2)" />
        <circle r="2" fill="#EC4899" opacity="0.4" transform="translate(3.5, 2)" />
      </g>
    ))}
  </svg>
);

const TransactionCard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const snakeDocRef = doc(db, 'gameState', 'snakeState');
    const unsub = onSnapshot(
      snakeDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FirebaseData;
          if (data.processed_txs) {
            const txArray = Object.values(data.processed_txs).sort(
              (a, b) => b.time - a.time
            );
            setTransactions(txArray);
          }
        } else {
          setError('No data found');
        }
      },
      (error) => {
        console.error('Firebase error:', error);
        setError(error.message);
      }
    );

    return () => unsub();
  }, []);

  const getTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const formatTxId = (txId: string) => {
    if (txId.length <= 12) return txId;
    return `${txId.slice(0, 6)}...${txId.slice(-4)}`;
  };

  const getSolscanUrl = (txId: string) => {
    return `https://solscan.io/tx/${txId}`;
  };

  return (
    <div className="transaction-card relative w-full max-w-md mx-auto my-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-100 overflow-hidden relative z-10">
        {/* Container for Header and Decorations */}
        <div className="transaction-card-header p-4 border-b border-emerald-100 flex justify-between items-center relative">
          {/* Flower Decorations at the Top */}
          <FlowerDecoration />
          {/* Header Content */}
          <div className="text-sm font-medium text-emerald-800 relative z-10">
            Recent Inputs
            {transactions.length > 0 && (
              <span className="text-emerald-600 ml-1">({transactions.length})</span>
            )}
          </div>
          <button className="p-1 hover:bg-emerald-50 rounded transition-colors relative z-10">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        {/* Card Body */}
        <div className="p-4">
          <div className="transaction-row text-emerald-700 text-sm font-medium mb-2 grid grid-cols-3 gap-4">
            <div>Time</div>
            <div>From</div>
            <div className="text-right">Amount</div>
          </div>
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div
                key={`transaction-${tx.tx_id}-${index}`}
                className="transaction-row text-sm hover:bg-emerald-50 rounded p-1 transition-colors grid grid-cols-3 gap-4 items-center"
              >
                <div className="text-emerald-600">{getTimeAgo(tx.time)}</div>
                <div className="font-mono">
                  <a
                    href={getSolscanUrl(tx.tx_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatTxId(tx.tx_id)}
                  </a>
                </div>
                <div className="text-right text-emerald-800">{tx.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 text-red-500 text-sm">
              {error}
            </div>
          )}
          {transactions.length === 0 && !error && (
            <div className="mt-4 text-gray-500 text-sm">
              No transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
