"use client";

import { useEffect } from "react";
import { useAppStore, Proposal } from "@/store/useAppStore";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, REFERENDUM_ABI } from "@/lib/contract";
import { ProposalCard } from "./ProposalCard";
import { motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";

export function HomeStep() {
  const { address } = useAccount();
  const { proposals, setProposals, setStep } = useAppStore();

  const { data: proposalCount, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: REFERENDUM_ABI,
    functionName: "proposalCount",
  });

  useEffect(() => {
    const loadProposals = async () => {
      if (!proposalCount || !address) return;

      const count = Number(proposalCount);
      if (count === 0) {
        setProposals([]);
        return;
      }

      const loadedProposals: Proposal[] = [];

      for (let i = count; i >= 1 && i >= count - 19; i--) {
        try {
          const response = await fetch(
            `${window.location.origin}/api/proposal?id=${i}&user=${address}`
          );
          if (response.ok) {
            const data = await response.json();
            loadedProposals.push(data);
          }
        } catch {
          // Skip failed proposals
        }
      }

      setProposals(loadedProposals);
    };

    loadProposals();
  }, [proposalCount, address, setProposals]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen px-6 py-24"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-4">
              REFERENDUM
            </h1>
            <p className="text-muted-foreground tracking-wide uppercase text-sm">
              {proposals.length} PROPOSALS
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              title="Refresh"
            >
              <RefreshCw size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setStep("create")}
              className="group relative inline-flex items-center gap-2 text-lg uppercase tracking-wider font-semibold text-accent py-2"
            >
              <Plus size={18} strokeWidth={1.5} />
              NEW
              <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-accent group-hover:scale-x-110 transition-transform origin-left" />
            </button>
          </div>
        </div>

        {/* Proposals Grid */}
        {proposals.length > 0 ? (
          <div className="grid gap-6">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border">
            <p className="text-muted-foreground text-lg mb-6">NO PROPOSALS YET</p>
            <button
              onClick={() => setStep("create")}
              className="group relative inline-flex items-center gap-2 text-lg uppercase tracking-wider font-semibold text-accent"
            >
              CREATE FIRST PROPOSAL
              <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-accent group-hover:scale-x-110 transition-transform origin-left" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
