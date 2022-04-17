// contracts/SimpleToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract JToken is ERC20 {
   constructor(uint256 initialSupply) public ERC20("JToken", "JT") {
        _mint(msg.sender, initialSupply);
    }
}