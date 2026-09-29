// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EvidenceRegistry
/// @notice Records SHA-256 fingerprints of scam-victim evidence files so anyone can later
///         check that a file is byte-for-byte identical to what was anchored, and when.
///         Only hashes are stored: no personal data ever touches the chain.
contract EvidenceRegistry {
    struct Anchor {
        bytes32 caseId;
        uint64 timestamp;
        address relayer;
    }

    address public owner;
    mapping(address => bool) public isRelayer;
    mapping(bytes32 => Anchor) private anchors;
    mapping(bytes32 => uint256) public caseFileCount;

    event RelayerSet(address indexed relayer, bool allowed);
    event EvidenceAnchored(bytes32 indexed caseId, bytes32 indexed fileHash, uint64 timestamp);

    error NotOwner();
    error NotRelayer();
    error EmptyBatch();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRelayer() {
        if (!isRelayer[msg.sender]) revert NotRelayer();
        _;
    }

    constructor(address relayer) {
        owner = msg.sender;
        isRelayer[relayer] = true;
        emit RelayerSet(relayer, true);
    }

    function setRelayer(address relayer, bool allowed) external onlyOwner {
        isRelayer[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    /// @notice Anchor a batch of file hashes for a case. Hashes that were already anchored
    ///         keep their original timestamp, so an anchor can never be backdated or moved.
    function anchor(bytes32 caseId, bytes32[] calldata fileHashes) external onlyRelayer returns (uint256 added) {
        if (fileHashes.length == 0) revert EmptyBatch();
        uint64 nowTs = uint64(block.timestamp);
        for (uint256 i = 0; i < fileHashes.length; i++) {
            bytes32 h = fileHashes[i];
            if (anchors[h].timestamp != 0) continue;
            anchors[h] = Anchor(caseId, nowTs, msg.sender);
            emit EvidenceAnchored(caseId, h, nowTs);
            added++;
        }
        caseFileCount[caseId] += added;
    }

    /// @notice Returns whether a file hash was anchored, and for which case and when.
    function verify(bytes32 fileHash) external view returns (bool found, bytes32 caseId, uint64 timestamp) {
        Anchor memory a = anchors[fileHash];
        return (a.timestamp != 0, a.caseId, a.timestamp);
    }
}
