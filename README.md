# REFERENDUM

Encrypted voting on chain. Votes stay private, only the final count is revealed.

**REFERENDUM solves this with FHE:**

| Traditional Voting | REFERENDUM (FHE) |
|--------------------|------------------|
| Votes visible on-chain | Votes encrypted on-chain |
| Anyone can see who voted what | Individual votes never revealed |
| Susceptible to coercion | Coercion-resistant |
| No privacy | Full privacy |

With Fully Homomorphic Encryption, computations happen directly on encrypted data. The smart contract aggregates votes without ever decrypting them. Only the final tally (YES: X, NO: Y) is revealed — never individual choices.

## Features

- **Create Proposals** — Set a title and voting duration (1 min to 24 hours)
- **Encrypted Voting** — Cast YES/NO votes that are encrypted in your browser before submission
- **Homomorphic Aggregation** — Votes are tallied on-chain without decryption using `FHE.select()` and `FHE.add()`
- **Time-locked Results** — Results can only be decrypted after the voting period ends
- **Public Decryption** — Anyone can trigger result reveal; no special permissions needed

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REFERENDUM FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CREATE PROPOSAL                                                         │
│     └─→ Contract initializes encrypted counters: euint64(0), euint64(0)     │
│                                                                             │
│  2. USER VOTES                                                              │
│     ├─→ Browser encrypts vote using fhevmjs SDK                             │
│     ├─→ Sends encrypted handle + proof to contract                          │
│     └─→ Contract uses FHE.select() to conditionally increment counters      │
│                                                                             │
│  3. VOTING ENDS                                                             │
│     ├─→ Anyone calls allowDecryption()                                      │
│     ├─→ Contract marks results as publicly decryptable                      │
│     └─→ Zama Relayer returns aggregated plaintext: YES: 5, NO: 3            │
│                                                                             │
│  ⚡ KEY POINT: Individual votes NEVER leave the browser in plaintext        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | TailwindCSS, Framer Motion |
| Wallet | RainbowKit, wagmi v2, viem |
| FHE SDK | @zama-fhe/relayer-sdk v0.3.0-5 |
| Smart Contract | Solidity 0.8.24, FHEVM v0.9 |
| Network | Ethereum Sepolia Testnet |

## Deployed Contract

| Network | Address | Status |
|---------|---------|--------|
| Sepolia | `0xBf1a9067Df11F0494E9D7638106AFd26C4E9329F` | [Verified ✓](https://sepolia.etherscan.io/address/0xBf1a9067Df11F0494E9D7638106AFd26C4E9329F#code) |

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or any EVM wallet
- Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com/))

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000, connect your wallet, and start voting!

### Run Tests

```bash
cd contracts
npm install
npm test
```

```
  Referendum
    Deployment
      ✔ Should deploy successfully
      ✔ Should initialize with zero proposal count
    Input Validation
      ✔ Should reject empty title
      ✔ Should reject zero duration
    View Functions
      ✔ getProposal should return exists=false for non-existent proposal
      ✔ hasUserVoted should return false for non-existent proposal
      ✔ isEnded should return true for non-existent proposal
    Access Control
      ✔ allowDecryption should reject for non-existent proposal
      ✔ vote should reject for non-existent proposal
      ✔ getProposalHandles should reject for non-existent proposal
    Contract Interface
      ✔ Should expose proposalCount as public
      ✔ Should expose hasVoted mapping

  12 passing (450ms)
```

> Note: FHE operations require Zama's precompiled contracts and can only be fully tested on Sepolia testnet.

## Contract Deployment

1. Create `contracts/.env`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
```

2. Deploy and verify:

```bash
cd contracts
npm run deploy
```

3. Update `frontend/src/lib/contract.ts` with the new address.

## Core FHE Logic

The heart of REFERENDUM is the homomorphic vote aggregation:

```solidity
// Vote function - no plaintext ever touches the contract
function vote(uint256 _proposalId, externalEbool _encryptedVote, bytes calldata _inputProof) external {
    ebool isYes = FHE.fromExternal(_encryptedVote, _inputProof);
    
    // Homomorphic conditional increment - computed on encrypted data
    p.yesVotes = FHE.select(isYes, FHE.add(p.yesVotes, FHE.asEuint64(1)), p.yesVotes);
    p.noVotes = FHE.select(isYes, p.noVotes, FHE.add(p.noVotes, FHE.asEuint64(1)));
}
```

This is real FHE computation:
- `FHE.select()` — Conditional branching on encrypted boolean
- `FHE.add()` — Addition on encrypted integers
- No decryption happens during computation

## Project Structure

```
referendum/
├── contracts/
│   ├── contracts/
│   │   └── Referendum.sol      # FHE voting contract
│   ├── scripts/
│   │   └── deploy.ts           # Deployment script
│   ├── test/
│   │   └── Referendum.test.ts  # Unit tests
│   └── hardhat.config.ts
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   ├── components/         # React components
│   │   ├── lib/                # FHE & contract utils
│   │   └── store/              # Zustand state
│   └── package.json
└── README.md
```

## Acknowledgments

This project was built for the [Zama Bounty Program](https://github.com/zama-ai/bounty-program).

Special thanks to:

- **[Zama](https://www.zama.ai/)** — For pioneering FHE technology and providing the FHEVM infrastructure
- **[fhEVM Documentation](https://docs.zama.ai/fhevm)** — Comprehensive guides that made this possible
- **Zama Developer Community** — For helpful discussions and examples
- **[RainbowKit](https://www.rainbowkit.com/)** & **[wagmi](https://wagmi.sh/)** — Excellent Web3 tooling

## License

MIT
