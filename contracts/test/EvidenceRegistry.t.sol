// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EvidenceRegistry} from "../src/EvidenceRegistry.sol";

contract EvidenceRegistryTest is Test {
    EvidenceRegistry reg;
    address relayer = address(0xBEEF);
    bytes32 caseId = keccak256("case-1");

    function setUp() public {
        reg = new EvidenceRegistry(relayer);
    }

    function _one(bytes32 h) internal pure returns (bytes32[] memory a) {
        a = new bytes32[](1);
        a[0] = h;
    }

    function test_AnchorAndVerify() public {
        bytes32 h = sha256("mutasi.pdf");
        bytes32[] memory batch = _one(h);
        vm.warp(1_790_000_000);
        vm.prank(relayer);
        uint256 added = reg.anchor(caseId, batch);
        assertEq(added, 1);
        (bool found, bytes32 c, uint64 ts) = reg.verify(h);
        assertTrue(found);
        assertEq(c, caseId);
        assertEq(ts, 1_790_000_000);
        assertEq(reg.caseFileCount(caseId), 1);
    }

    function test_EditedFileDoesNotVerify() public {
        bytes32[] memory batch = _one(sha256("mutasi.pdf"));
        bytes32 edited = sha256("mutasi.pdF");
        vm.prank(relayer);
        reg.anchor(caseId, batch);
        (bool found,,) = reg.verify(edited);
        assertFalse(found);
    }

    function test_CannotBackdateOrMoveExistingAnchor() public {
        bytes32 h = sha256("chat.txt");
        bytes32[] memory batch = _one(h);
        vm.warp(1000);
        vm.prank(relayer);
        reg.anchor(caseId, batch);
        vm.warp(2000);
        vm.prank(relayer);
        uint256 added = reg.anchor(keccak256("other-case"), batch);
        assertEq(added, 0);
        (, bytes32 c, uint64 ts) = reg.verify(h);
        assertEq(c, caseId);
        assertEq(ts, 1000);
    }

    function test_OnlyRelayer() public {
        bytes32[] memory batch = _one(sha256("x"));
        vm.expectRevert(EvidenceRegistry.NotRelayer.selector);
        reg.anchor(caseId, batch);
    }

    function test_EmptyBatchReverts() public {
        vm.prank(relayer);
        vm.expectRevert(EvidenceRegistry.EmptyBatch.selector);
        reg.anchor(caseId, new bytes32[](0));
    }

    function test_OwnerCanManageRelayers() public {
        address r2 = address(0xCAFE);
        reg.setRelayer(r2, true);
        assertTrue(reg.isRelayer(r2));
        vm.prank(r2);
        vm.expectRevert(EvidenceRegistry.NotOwner.selector);
        reg.setRelayer(relayer, false);
    }
}
