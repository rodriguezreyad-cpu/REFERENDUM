"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useGasPrice } from "wagmi";
import { CONTRACT_ADDRESS, REFERENDUM_ABI, DURATION_OPTIONS } from "@/lib/contract";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { parseGwei } from "viem";

const MIN_GAS_PRICE = parseGwei("1");

export function CreateStep() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[0].value);
  const { setStep, setLoading, fhevmStatus } = useAppStore();
  const { address } = useAccount();
  const processedHash = useRef<string | null>(null);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { data: currentGasPrice } = useGasPrice();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    confirmations: 1,
    pollingInterval: 2000,
  });

  useEffect(() => {
    if (isSuccess && hash && processedHash.current !== hash) {
      processedHash.current = hash;
      setTitle("");
      setLoading(false);
      reset();
      // Navigate back to home - ProposalList will sync from chain
      setStep("home");
    }
  }, [isSuccess, hash, setStep, setLoading, reset]);

  useEffect(() => {
    if (error) setLoading(false);
  }, [error, setLoading]);

  useEffect(() => {
    if (isPending) {
      setLoading(true, "SIGNING...");
    } else if (isConfirming && hash) {
      setLoading(true, "CONFIRMING...", `https://sepolia.etherscan.io/tx/${hash}`);
    }
  }, [isPending, isConfirming, hash, setLoading]);

  useEffect(() => { processedHash.current = null; }, []);

  const handleCreate = () => {
    if (!title.trim() || !address) return;
    if (fhevmStatus !== "ready") return;

    const gasPrice = currentGasPrice && currentGasPrice > MIN_GAS_PRICE 
      ? currentGasPrice 
      : MIN_GAS_PRICE;

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: REFERENDUM_ABI,
      functionName: "createProposal",
      args: [title.trim(), BigInt(duration)],
      gasPrice,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <span className="absolute top-20 right-8 text-[12rem] font-bold text-border/30 leading-none select-none hidden lg:block">
        02
      </span>

      <div className="w-full max-w-2xl">
        <button
          onClick={() => setStep("home")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12 text-sm uppercase tracking-wider"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          BACK
        </button>

        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-16">
          CREATE PROPOSAL
        </h2>

        <div className="space-y-12">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-4">
              TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="WHAT TO VOTE ON"
              className="w-full bg-input border border-border h-14 px-4 text-lg placeholder:text-muted-foreground focus:border-accent outline-none transition-colors"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-4">
              DURATION
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`h-14 border text-sm uppercase tracking-wider font-semibold transition-all ${
                    duration === opt.value
                      ? "border-accent text-accent"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!title.trim() || isPending || isConfirming || fhevmStatus !== "ready" || !address}
            className="group relative inline-flex items-center gap-3 text-xl uppercase tracking-wider font-bold text-accent py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CREATE
            <ArrowRight size={20} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform" />
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent group-hover:scale-x-110 transition-transform origin-left" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
