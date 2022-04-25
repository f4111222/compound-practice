// contracts/SimpleToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract JToken is ERC20 {
   constructor() public ERC20("JToken", "JT") {
       uint256 initialSupply = 10000000000000 *10**uint256(8);
        _mint(msg.sender, initialSupply);
    }
}