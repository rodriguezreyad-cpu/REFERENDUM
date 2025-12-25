"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppStore } from "@/store/useAppStore";
import { resetFhevm } from "@/lib/fhe";
import { StatusBar } from "@/components/StatusBar";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ConnectStep } from "@/components/ConnectStep";
import { HomeStep } from "@/components/HomeStep";
import { CreateStep } from "@/components/CreateStep";
import { VoteStep } from "@/components/VoteStep";

export default function Home() {
  const { isConnected } = useAccount();
  const { step, reset, setFhevmStatus } = useAppStore();

  // Reset on disconnect
  useEffect(() => {
    if (!isConnected) {
      reset();
      resetFhevm();
      setFhevmStatus("idle");
    }
  }, [isConnected, reset, setFhevmStatus]);

  const renderStep = () => {
    switch (step) {
      case "connect":
        return <ConnectStep />;
      case "home":
        return <HomeStep />;
      case "create":
        return <CreateStep />;
      case "vote":
        return <VoteStep />;
      default:
        return <ConnectStep />;
    }
  };

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <StatusBar />
      <LoadingOverlay />
      {renderStep()}
    </main>
  );
}
