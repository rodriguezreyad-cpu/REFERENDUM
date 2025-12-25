"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { motion } from "framer-motion";
import { Proposal, useAppStore } from "@/store/useAppStore";
import { CONTRACT_ADDRESS, REFERENDUM_ABI } from "@/lib/contract";
import { encryptVote, requestPublicDecryption } from "@/lib/fhe";
import { Clock, Check, X, Unlock } from "lucide-react";

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const { address } = useAccount();
  const { updateProposal, setLoading, fhevmStatus } = useAppStore();
  
  const [timeLeft, setTimeLeft] = useState("");
  const [isEnded, setIsEnded] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [pendingDecrypt, setPendingDecrypt] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState<{ yes: number; no: number } | null>(null);

  // For voting
  const { writeContract, data: voteHash, isPending: isVotePending, reset: resetVote } = useWriteContract();
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({ hash: voteHash });

  // For allowDecryption
  const { writeContract: writeAllow, data: allowHash, reset: resetAllow } = useWriteContract();
  const { isLoading: isAllowConfirming, isSuccess: isAllowSuccess } = useWaitForTransactionReceipt({ hash: allowHash });

  // Read handles for decryption
  const { data: handles, refetch: refetchHandles } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERENDUM_ABI,
    functionName: "getProposalHandles",
    args: [BigInt(proposal.id)],
    query: { enabled: isEnded },
  });

  // Timer
  useEffect(() => {
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = proposal.endTime - now;

      if (remaining <= 0) {
        setTimeLeft("ENDED");
        setIsEnded(true);
      } else {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        
        if (h > 0) {
          setTimeLeft(`${h}H ${m}M`);
        } else if (m > 0) {
          setTimeLeft(`${m}M ${s}S`);
        } else {
          setTimeLeft(`${s}S`);
        }
        setIsEnded(false);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [proposal.endTime]);

  // Handle vote success
  useEffect(() => {
    if (isVoteSuccess && isVoting) {
      setIsVoting(false);
      setLoading(false);
      updateProposal(proposal.id, { hasVoted: true });
      resetVote();
    }
  }, [isVoteSuccess, isVoting]);

  // Handle allowDecryption success -> then decrypt
  useEffect(() => {
    if (isAllowSuccess && pendingDecrypt) {
      setPendingDecrypt(false);
      resetAllow();
      performDecryption();
    }
  }, [isAllowSuccess, pendingDecrypt]);

  const performDecryption = async () => {
    setLoading(true, "DECRYPTING...");
    
    try {
      const { data: freshHandles } = await refetchHandles();
      
      if (!freshHandles) {
        throw new Error("No handles");
      }

      const [yesHandle, noHandle] = freshHandles as [string, string];
      const { values } = await requestPublicDecryption([yesHandle, noHandle]);

      const yesVotes = Number(values[0]);
      const noVotes = Number(values[1]);

      setDecryptedResult({ yes: yesVotes, no: noVotes });
      updateProposal(proposal.id, { 
        resultRevealed: true,
        revealedYes: yesVotes, 
        revealedNo: noVotes,
      });

    } catch (error: any) {
      alert("Decrypt failed: " + error.message);
    } finally {
      setIsDecrypting(false);
      setLoading(false);
    }
  };

  const handleVote = async (choice: "yes" | "no") => {
    if (proposal.hasVoted || !address) return;
    if (fhevmStatus !== "ready") return;

    setLoading(true, "ENCRYPTING...");
    setIsVoting(true);

    try {
      const encrypted = await encryptVote(CONTRACT_ADDRESS, address, choice === "yes");
      
      setLoading(true, "SUBMITTING...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: REFERENDUM_ABI,
        functionName: "vote",
        args: [BigInt(proposal.id), encrypted.handle, encrypted.inputProof],
        gas: BigInt(5000000),
      });

    } catch (error: any) {
      setIsVoting(false);
      setLoading(false);
      alert("Vote failed: " + error.message);
    }
  };

  const handleViewResults = async () => {
    if (!address || !handles) return;

    setIsDecrypting(true);
    setLoading(true, "UNLOCKING...");
    setPendingDecrypt(true);
    
    try {
      writeAllow({
        address: CONTRACT_ADDRESS,
        abi: REFERENDUM_ABI,
        functionName: "allowDecryption",
        args: [BigInt(proposal.id)],
        gas: BigInt(3000000),
      });
    } catch (error: any) {
      setIsDecrypting(false);
      setPendingDecrypt(false);
      setLoading(false);
      alert("Failed: " + error.message);
    }
  };

  // Update loading during confirmation
  useEffect(() => {
    if (isVotePending) {
      setLoading(true, "SIGNING...");
    } else if (isVoteConfirming) {
      setLoading(true, "CONFIRMING...");
    }
  }, [isVotePending, isVoteConfirming]);

  useEffect(() => {
    if (isAllowConfirming && pendingDecrypt) {
      setLoading(true, "CONFIRMING...");
    }
  }, [isAllowConfirming, pendingDecrypt]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayYes = decryptedResult?.yes ?? proposal.revealedYes ?? 0;
  const displayNo = decryptedResult?.no ?? proposal.revealedNo ?? 0;
  const hasResults = decryptedResult !== null || proposal.resultRevealed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border p-6 transition-all ${
        hasResults ? "border-accent/50" : isEnded ? "border-foreground/30" : "border-border hover:border-foreground/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-xl font-bold tracking-tight leading-tight flex-1">
          {proposal.title}
        </h3>
        <span className="text-xs font-mono text-muted-foreground shrink-0">
          #{proposal.id}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
        <span className="font-mono">{formatDate(proposal.createdAt)}</span>
      </div>

      {/* Timer / Results */}
      {hasResults ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 border border-green-500/30">
            <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
              <Check size={16} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">YES</span>
            </div>
            <span className="text-2xl font-bold font-mono">{displayYes}</span>
          </div>
          <div className="text-center p-4 border border-red-500/30">
            <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
              <X size={16} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-wider">NO</span>
            </div>
            <span className="text-2xl font-bold font-mono">{displayNo}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-6">
          <Clock size={14} strokeWidth={1.5} className={isEnded ? "text-accent" : "text-muted-foreground"} />
          <span className={`font-mono text-lg tracking-tight ${isEnded ? "text-accent" : "text-foreground"}`}>
            {timeLeft}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        {!isEnded && !proposal.hasVoted && (
          <>
            <button
              onClick={() => handleVote("yes")}
              disabled={isVoting || isVotePending || isVoteConfirming || fhevmStatus !== "ready"}
              className="group relative inline-flex items-center gap-2 text-sm uppercase tracking-wider font-semibold text-green-500 disabled:opacity-50"
            >
              <Check size={14} strokeWidth={1.5} />
              YES
              <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-green-500 scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
            </button>
            <button
              onClick={() => handleVote("no")}
              disabled={isVoting || isVotePending || isVoteConfirming || fhevmStatus !== "ready"}
              className="group relative inline-flex items-center gap-2 text-sm uppercase tracking-wider font-semibold text-red-500 disabled:opacity-50"
            >
              <X size={14} strokeWidth={1.5} />
              NO
              <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-red-500 scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
            </button>
          </>
        )}

        {!isEnded && proposal.hasVoted && (
          <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Check size={12} strokeWidth={1.5} />
            VOTED
          </span>
        )}

        {isEnded && !hasResults && (
          <button
            onClick={handleViewResults}
            disabled={isDecrypting || !handles}
            className="group relative inline-flex items-center gap-2 text-sm uppercase tracking-wider font-semibold text-accent disabled:opacity-50"
          >
            <Unlock size={14} strokeWidth={1.5} />
            {isDecrypting ? "DECRYPTING..." : !handles ? "LOADING..." : "VIEW RESULTS"}
            <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-accent scale-x-100 group-hover:scale-x-110 transition-transform origin-left" />
          </button>
        )}

        {hasResults && (
          <span className="text-xs uppercase tracking-wider text-accent flex items-center gap-2">
            <Check size={12} strokeWidth={1.5} />
            REVEALED
          </span>
        )}
      </div>
    </motion.div>
  );
}
