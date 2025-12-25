"use client";

import { useState, useEffect } from "react";
import { useAppStore, useCurrentProposal } from "@/store/useAppStore";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, REFERENDUM_ABI } from "@/lib/contract";
import { encryptVote } from "@/lib/fhe";
import { motion } from "framer-motion";
import { Check, X, ArrowLeft } from "lucide-react";

export function VoteStep() {
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { setStep, updateProposal, setLoading } = useAppStore();
  const currentProposal = useCurrentProposal();
  const { address } = useAccount();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
    confirmations: 1,
    pollingInterval: 2000,
  });

  useEffect(() => {
    if (isEncrypting) {
      setLoading(true, "ENCRYPTING VOTE...");
    } else if (isPending) {
      setLoading(true, "SIGNING...");
    } else if (isConfirming && hash) {
      setLoading(true, "CONFIRMING...", `https://sepolia.etherscan.io/tx/${hash}`);
    } else {
      setLoading(false);
    }
  }, [isEncrypting, isPending, isConfirming, hash, setLoading]);

  useEffect(() => {
    if (isSuccess && currentProposal) {
      updateProposal(currentProposal.id, { hasVoted: true });
      setStep("home");
    }
  }, [isSuccess, currentProposal, updateProposal, setStep]);

  const handleVote = async () => {
    if (selectedVote === null || !address || !currentProposal) return;

    try {
      setIsEncrypting(true);
      const encrypted = await encryptVote(CONTRACT_ADDRESS, address, selectedVote);
      setIsEncrypting(false);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REFERENDUM_ABI,
        functionName: "vote",
        args: [BigInt(currentProposal.id), encrypted.handle, encrypted.inputProof],
        gas: BigInt(3000000),
      });
    } catch {
      setIsEncrypting(false);
    }
  };

  if (!currentProposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => setStep("home")} className="text-accent underline">
          GO BACK
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <span className="absolute top-20 left-8 text-[12rem] font-bold text-border/30 leading-none select-none hidden lg:block">
        03
      </span>

      <div className="w-full max-w-3xl text-center">
        <button
          onClick={() => setStep("home")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-12 text-sm uppercase tracking-wider"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          BACK
        </button>

        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
          VOTE ON PROPOSAL #{currentProposal.id}
        </p>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight mb-16">
          {currentProposal.title}
        </h2>

        <div className="flex justify-center gap-8 mb-16">
          <button
            onClick={() => setSelectedVote(true)}
            className={`group w-40 h-40 border-2 flex flex-col items-center justify-center gap-4 transition-all ${
              selectedVote === true
                ? "border-green-500 text-green-500"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            <Check size={48} strokeWidth={1.5} />
            <span className="text-2xl font-bold tracking-wider">YES</span>
          </button>

          <button
            onClick={() => setSelectedVote(false)}
            className={`group w-40 h-40 border-2 flex flex-col items-center justify-center gap-4 transition-all ${
              selectedVote === false
                ? "border-red-500 text-red-500"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            <X size={48} strokeWidth={1.5} />
            <span className="text-2xl font-bold tracking-wider">NO</span>
          </button>
        </div>

        {selectedVote !== null && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleVote}
            disabled={isEncrypting || isPending || isConfirming}
            className="group relative inline-flex items-center gap-3 text-xl uppercase tracking-wider font-bold text-accent py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SUBMIT ENCRYPTED VOTE
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent group-hover:scale-x-110 transition-transform origin-left" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
