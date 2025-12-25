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

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const proposalId = BigInt(id);

    const handles = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: REFERENDUM_ABI,
      functionName: "getProposalHandles",
      args: [proposalId],
    });

    const [yesHandle, noHandle] = handles;

    return NextResponse.json({
      yesHandle,
      noHandle,
    });
  } catch (error: any) {
    console.error("Failed to fetch handles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch handles" },
      { status: 500 }
    );
  }
}

