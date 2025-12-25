// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, externalEbool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract Referendum is ZamaEthereumConfig {
    
    struct Proposal {
        string title;
        address creator;
        uint256 endTime;
        euint64 yesVotes;
        euint64 noVotes;
        bool exists;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed id, string title, address creator, uint256 endTime);
    event VoteCast(uint256 indexed id, address voter);
    event DecryptionReady(uint256 indexed id, bytes32 yesHandle, bytes32 noHandle);

    function createProposal(string calldata _title, uint256 _durationMinutes) external returns (uint256) {
        require(bytes(_title).length > 0, "Empty title");
        require(_durationMinutes >= 1, "Min 1 minute");

        proposalCount++;
        uint256 id = proposalCount;

        euint64 zeroYes = FHE.asEuint64(0);
        euint64 zeroNo = FHE.asEuint64(0);
        FHE.allowThis(zeroYes);
        FHE.allowThis(zeroNo);

        proposals[id] = Proposal({
            title: _title,
            creator: msg.sender,
            endTime: block.timestamp + (_durationMinutes * 1 minutes),
            yesVotes: zeroYes,
            noVotes: zeroNo,
            exists: true
        });

        emit ProposalCreated(id, _title, msg.sender, proposals[id].endTime);
        return id;
    }

    function vote(
        uint256 _proposalId,
        externalEbool _encryptedVote,
        bytes calldata _inputProof
    ) external {
        Proposal storage p = proposals[_proposalId];
        require(p.exists, "Not found");
        require(block.timestamp < p.endTime, "Ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        ebool isYes = FHE.fromExternal(_encryptedVote, _inputProof);
        
        p.yesVotes = FHE.select(isYes, FHE.add(p.yesVotes, FHE.asEuint64(1)), p.yesVotes);
        p.noVotes = FHE.select(isYes, p.noVotes, FHE.add(p.noVotes, FHE.asEuint64(1)));
        
        FHE.allowThis(p.yesVotes);
        FHE.allowThis(p.noVotes);

        hasVoted[_proposalId][msg.sender] = true;
        emit VoteCast(_proposalId, msg.sender);
    }

    function allowDecryption(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(p.exists, "Not found");
        require(block.timestamp >= p.endTime, "Not ended");

        FHE.makePubliclyDecryptable(p.yesVotes);
        FHE.makePubliclyDecryptable(p.noVotes);

        emit DecryptionReady(
            _proposalId,
            FHE.toBytes32(p.yesVotes),
            FHE.toBytes32(p.noVotes)
        );
    }

    function getProposal(uint256 _proposalId) external view returns (
        string memory title,
        address creator,
        uint256 endTime,
        bool exists
    ) {
        Proposal storage p = proposals[_proposalId];
        return (p.title, p.creator, p.endTime, p.exists);
    }

    function getProposalHandles(uint256 _proposalId) external view returns (
        bytes32 yesHandle,
        bytes32 noHandle
    ) {
        Proposal storage p = proposals[_proposalId];
        require(p.exists, "Not found");
        return (FHE.toBytes32(p.yesVotes), FHE.toBytes32(p.noVotes));
    }

    function hasUserVoted(uint256 _proposalId, address _user) external view returns (bool) {
        return hasVoted[_proposalId][_user];
    }

    function isEnded(uint256 _proposalId) external view returns (bool) {
        return block.timestamp >= proposals[_proposalId].endTime;
    }
}
