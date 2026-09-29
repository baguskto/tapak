// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {EvidenceRegistry} from "../src/EvidenceRegistry.sol";
import {DemoUSDT} from "../src/DemoUSDT.sol";

/// Deploys EvidenceRegistry (relayer = deployer) and the demo tUSDT token.
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("RELAYER_PRIVATE_KEY");
        address relayer = vm.addr(pk);
        vm.startBroadcast(pk);
        EvidenceRegistry reg = new EvidenceRegistry(relayer);
        DemoUSDT usdt = new DemoUSDT();
        vm.stopBroadcast();
        console.log("EvidenceRegistry", address(reg));
        console.log("DemoUSDT", address(usdt));
    }
}
