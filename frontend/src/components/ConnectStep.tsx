"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";
import { initFhevm } from "@/lib/fhe";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function ConnectStep() {
  const { isConnected } = useAccount();
  const { fhevmStatus, setFhevmStatus, setFhevmError, setStep } = useAppStore();

  // Initialize FHEVM on mount
  useEffect(() => {
    const init = async () => {
      if (fhevmStatus === "idle") {
        setFhevmStatus("initializing");
        try {
          await initFhevm();
          setFhevmStatus("ready");
        } catch (e: any) {
          setFhevmStatus("error");
          setFhevmError(e.message);
        }
      }
    };
    init();
  }, [fhevmStatus, setFhevmStatus, setFhevmError]);

  const handleStart = () => {
    if (isConnected && fhevmStatus === "ready") {
      setStep("home");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      {/* Decorative number */}
      <span className="absolute top-20 left-8 text-[12rem] font-bold text-border/30 leading-none select-none hidden lg:block">
        01
      </span>

      <div className="text-center max-w-4xl">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none mb-8">
          REFERENDUM
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl tracking-wide mb-16 max-w-xl mx-auto">
          ENCRYPTED ON-CHAIN VOTING
        </p>

        <div className="flex flex-col items-center gap-8">
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, mounted }) => {
              const connected = mounted && account && chain;

              return (
                <button
                  onClick={connected ? undefined : openConnectModal}
                  className={`relative inline-flex items-center gap-3 text-lg uppercase tracking-wider font-semibold transition-all ${
                    connected
                      ? "text-muted-foreground cursor-default"
                      : "text-accent hover:text-foreground"
                  }`}
                >
                  {connected ? "CONNECTED" : "CONNECT WALLET"}
                  {!connected && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent" />
                  )}
                </button>
              );
            }}
          </ConnectButton.Custom>

          {isConnected && fhevmStatus === "ready" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleStart}
              className="group relative inline-flex items-center gap-3 text-xl uppercase tracking-wider font-bold text-foreground py-4"
            >
              BEGIN
              <ArrowRight size={20} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-foreground group-hover:scale-x-110 transition-transform origin-left" />
            </motion.button>
          )}

          {isConnected && fhevmStatus === "initializing" && (
            <p className="text-muted-foreground text-sm tracking-wider uppercase font-mono">
              INITIALIZING FHEVM...
            </p>
          )}

          {fhevmStatus === "error" && (
            <p className="text-red-500 text-sm tracking-wider uppercase font-mono">
              FHEVM ERROR
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
