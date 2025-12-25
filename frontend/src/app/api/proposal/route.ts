import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { CONTRACT_ADDRESS, REFERENDUM_ABI } from "@/lib/contract";

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/Slm9qwv5QVNfOKlY8SO2l"),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const user = searchParams.get("user");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const proposalId = BigInt(id);

    // Get proposal data
    const proposal = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: REFERENDUM_ABI,
      functionName: "getProposal",
      args: [proposalId],
    });

    // Check if user has voted
    let hasVoted = false;
    if (user) {
      hasVoted = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: REFERENDUM_ABI,
        functionName: "hasUserVoted",
        args: [proposalId, user as `0x${string}`],
      });
    }

    const [title, creator, endTime, exists] = proposal;

    if (!exists) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Estimate creation time (endTime - assumed duration)
    const createdAt = Number(endTime) - 300; // Assume 5 min default

    return NextResponse.json({
      id: Number(id),
      title,
      creator,
      endTime: Number(endTime),
      createdAt,
      hasVoted,
      resultRevealed: false,
    });
  } catch (error: any) {
    console.error("Failed to fetch proposal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch proposal" },
      { status: 500 }
    );
  }
}
