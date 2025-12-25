"use client";

import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// Use Alchemy RPC for reliable polling
const ALCHEMY_RPC = "https://eth-sepolia.g.alchemy.com/v2/Slm9qwv5QVNfOKlY8SO2l";

const config = getDefaultConfig({
  appName: "Referendum",
  projectId: "3a8170812b534d0ff9d794f19a901d64",
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(ALCHEMY_RPC, { 
      batch: true,
      retryCount: 3,
    }),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#FF3D00",
            accentColorForeground: "#0A0A0A",
            borderRadius: "none",
            fontStack: "system",
          })}
          modalSize="compact"
          locale="en"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

