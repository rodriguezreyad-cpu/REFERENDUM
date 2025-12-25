"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";

export function LoadingOverlay() {
  const { isLoading, loadingMessage, loadingTxLink } = useAppStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.div
              className="w-16 h-16 border-2 border-accent border-t-transparent mx-auto mb-8"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-lg tracking-wider uppercase font-mono text-muted-foreground">
              {loadingMessage || "Processing..."}
            </p>
            {loadingTxLink && (
              <a
                href={loadingTxLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-accent hover:underline"
              >
                VIEW ON ETHERSCAN
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

