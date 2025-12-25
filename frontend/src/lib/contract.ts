export const CONTRACT_ADDRESS = "0xBf1a9067Df11F0494E9D7638106AFd26C4E9329F" as const;

export const REFERENDUM_ABI = [
  {
    inputs: [{ name: "_title", type: "string" }, { name: "_durationMinutes", type: "uint256" }],
    name: "createProposal",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_encryptedVote", type: "bytes32" },
      { name: "_inputProof", type: "bytes" },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_proposalId", type: "uint256" }],
    name: "allowDecryption",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_proposalId", type: "uint256" }],
    name: "getProposal",
    outputs: [
      { name: "title", type: "string" },
      { name: "creator", type: "address" },
      { name: "endTime", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_proposalId", type: "uint256" }],
    name: "getProposalHandles",
    outputs: [
      { name: "yesHandle", type: "bytes32" },
      { name: "noHandle", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "_proposalId", type: "uint256" },
      { name: "_user", type: "address" },
    ],
    name: "hasUserVoted",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_proposalId", type: "uint256" }],
    name: "isEnded",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proposalCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "title", type: "string" },
      { indexed: false, name: "creator", type: "address" },
      { indexed: false, name: "endTime", type: "uint256" },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "voter", type: "address" },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "yesHandle", type: "bytes32" },
      { indexed: false, name: "noHandle", type: "bytes32" },
    ],
    name: "DecryptionReady",
    type: "event",
  },
] as const;

export const DURATION_OPTIONS = [
  { label: "1 MIN", value: 1 },
  { label: "5 MIN", value: 5 },
  { label: "1 HOUR", value: 60 },
  { label: "24 HOURS", value: 1440 },
] as const;
