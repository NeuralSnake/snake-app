"use client";

import React from 'react';
import { X } from 'lucide-react';

interface GoldenAppleNotificationProps {
  tx_id: string;
  amount: number;
  time: number;
  onClose: () => void;
}

const getSolscanUrl = (txId: string): string => {
  return `https://solscan.io/tx/${txId}`;
};

const formatTxId = (txId: string): string => {
  if (txId.length <= 12) return txId;
  return `${txId.slice(0, 6)}...${txId.slice(-4)}`;
};

const GoldenAppleNotification: React.FC<GoldenAppleNotificationProps> = ({
  tx_id,
  amount,
  time,
  onClose
}) => {
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <h3 className="font-semibold text-sm text-yellow-900">Golden Apple Spawned!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-yellow-700 hover:text-yellow-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-yellow-800">Transaction</span>
            <a
              href={getSolscanUrl(tx_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[180px]"
            >
              {formatTxId(tx_id)}
            </a>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-yellow-800">Amount</span>
            <span className="font-mono text-yellow-900">{amount} SOL</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-yellow-800">Time</span>
            <span className="text-yellow-900">
              {new Date(time * 1000).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-500" />
    </div>
  );
};

export default GoldenAppleNotification;