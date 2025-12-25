"use client";

import { useAppStore } from "@/store/useAppStore";
import { useAccount, useDisconnect } from "wagmi";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { Copy, ExternalLink, Check, LogOut } from "lucide-react";
import { useState } from "react";

export function StatusBar() {
  const { fhevmStatus } = useAppStore();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const getStatusColor = () => {
    switch (fhevmStatus) {
      case "ready":
        return "text-green-500";
      case "initializing":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (fhevmStatus) {
      case "ready":
        return "FHEVM ●";
      case "initializing":
        return "FHEVM ◐";
      case "error":
        return "FHEVM ✕";
      default:
        return "FHEVM ○";
    }
  };

  return (
    <div className="fixed top-0 right-0 z-50 flex items-center gap-4 p-4 text-xs font-mono tracking-wider uppercase">
      <span className={getStatusColor()}>{getStatusText()}</span>

      <a
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {shortenAddress(CONTRACT_ADDRESS)}
          <ExternalLink size={12} strokeWidth={1.5} />
        </a>

      {address && (
        <>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {shortenAddress(address)}
            {copied ? (
              <Check size={12} strokeWidth={1.5} className="text-accent" />
            ) : (
              <Copy size={12} strokeWidth={1.5} />
            )}
          </button>

          <button
            onClick={() => disconnect()}
            className="flex items-center gap-1 text-muted-foreground hover:text-accent transition-colors"
            title="Disconnect Wallet"
          >
            <LogOut size={12} strokeWidth={1.5} />
          </button>
        </>
      )}
    </div>
  );
}
