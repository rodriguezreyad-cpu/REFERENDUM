"use client";

let instance: any = null;
let isInitialized = false;
let initError: string | null = null;
let isInitializing = false;

function toHex(arr: Uint8Array): `0x${string}` {
  return `0x${Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function initFhevm(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("FHEVM can only be initialized in browser");
  }
  
  if (instance && isInitialized) return instance;
  if (initError) throw new Error(initError);
  if (isInitializing) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (isInitialized && instance) {
          clearInterval(checkInterval);
          resolve(instance);
        }
        if (initError) {
          clearInterval(checkInterval);
          reject(new Error(initError));
        }
      }, 100);
    });
  }

  isInitializing = true;

  try {
    const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/web");
    await initSDK({ thread: 0 });
    instance = await createInstance(SepoliaConfig);
    isInitialized = true;
    return instance;
  } catch (error: any) {
    initError = error.message || "Failed to initialize FHEVM";
    throw error;
  } finally {
    isInitializing = false;
  }
}

export function isFhevmReady(): boolean {
  return isInitialized && instance !== null;
}

export function getFhevmError(): string | null {
  return initError;
}

export async function encryptVote(
  contractAddress: string,
  userAddress: string,
  isYes: boolean
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> {
  const fhevm = await initFhevm();
  const input = fhevm.createEncryptedInput(contractAddress, userAddress);
  input.addBool(isYes);
  const encrypted = await input.encrypt();
  
  return {
    handle: toHex(encrypted.handles[0]),
    inputProof: toHex(encrypted.inputProof),
  };
}

export async function requestPublicDecryption(
  handles: string[]
): Promise<{ values: bigint[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handles }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes("520") || errorText.includes("Web server")) {
        throw new Error("Zama Relayer is down");
      } else if (errorText.includes("not allowed")) {
        throw new Error("Not allowed for decryption");
      } else {
        throw new Error(`Relayer error: ${response.status}`);
      }
    }

    const result = await response.json();
    const values: bigint[] = [];
    
    if (result.response && Array.isArray(result.response) && result.response[0]?.decrypted_value) {
      const hexStr = result.response[0].decrypted_value;
      const chunkSize = 64;
      for (let i = 0; i < handles.length; i++) {
        const chunk = hexStr.slice(i * chunkSize, (i + 1) * chunkSize);
        values.push(chunk ? BigInt("0x" + chunk) : BigInt(0));
      }
    } else if (result.clearValues) {
      for (const handle of handles) {
        const val = result.clearValues[handle];
        values.push(val !== undefined && val !== null ? BigInt(val) : BigInt(0));
      }
    } else if (result.decryptedValues) {
      for (const handle of handles) {
        const val = result.decryptedValues[handle];
        values.push(val !== undefined && val !== null ? BigInt(val) : BigInt(0));
      }
    } else if (Array.isArray(result.values)) {
      for (const val of result.values) values.push(BigInt(val));
    } else if (Array.isArray(result)) {
      for (const val of result) values.push(BigInt(val));
    } else {
      for (const handle of handles) {
        const val = result[handle];
        values.push(val !== undefined && val !== null ? BigInt(val) : BigInt(0));
      }
    }

    return { values };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error("Decryption timeout (30s)");
    }
    throw error;
  }
}

export function resetFhevm() {
  instance = null;
  isInitialized = false;
  initError = null;
  isInitializing = false;
}
