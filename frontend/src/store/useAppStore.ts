import { create } from "zustand";

type FhevmStatus = "idle" | "initializing" | "ready" | "error";
type AppStep = "connect" | "home" | "create" | "vote";

export interface Proposal {
  id: number;
  title: string;
  creator: string;
  endTime: number;
  createdAt: number;
  hasVoted: boolean;
  resultRevealed: boolean;
  revealedYes?: number;
  revealedNo?: number;
}

interface AppStore {
  // FHEVM state
  fhevmStatus: FhevmStatus;
  fhevmError: string | null;
  setFhevmStatus: (status: FhevmStatus) => void;
  setFhevmError: (error: string | null) => void;

  // App flow state
  step: AppStep;
  setStep: (step: AppStep) => void;

  // Proposals list
  proposals: Proposal[];
  setProposals: (proposals: Proposal[]) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: number, updates: Partial<Proposal>) => void;

  // Current proposal for detail view
  currentProposalId: number | null;
  setCurrentProposalId: (id: number | null) => void;

  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  loadingTxLink: string | null;
  setLoading: (loading: boolean, message?: string, txLink?: string) => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  fhevmStatus: "idle",
  fhevmError: null,
  setFhevmStatus: (status) => set({ fhevmStatus: status }),
  setFhevmError: (error) => set({ fhevmError: error }),

  step: "connect",
  setStep: (step) => set({ step }),

  proposals: [],
  setProposals: (proposals) => set({ proposals }),
  addProposal: (proposal) => set({ proposals: [proposal, ...get().proposals] }),
  updateProposal: (id, updates) =>
    set({
      proposals: get().proposals.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }),

  currentProposalId: null,
  setCurrentProposalId: (id) => set({ currentProposalId: id }),

  isLoading: false,
  loadingMessage: "",
  loadingTxLink: null,
  setLoading: (loading, message = "", txLink) => set({ isLoading: loading, loadingMessage: message, loadingTxLink: txLink || null }),

  reset: () =>
    set({
      step: "connect",
      proposals: [],
      currentProposalId: null,
      isLoading: false,
      loadingMessage: "",
      loadingTxLink: null,
    }),
}));

// Selector for current proposal
export const useCurrentProposal = () => {
  const { proposals, currentProposalId } = useAppStore();
  return proposals.find((p) => p.id === currentProposalId) ?? null;
};
