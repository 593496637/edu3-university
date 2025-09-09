// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YDToken is ERC20, Ownable {
    constructor() ERC20("YunDa Token", "YD") Ownable(msg.sender) {
        // 给部署者铸造 100万个代币 (18位小数)
        _mint(msg.sender, 1000000 * 10 ** 18);
    }

    // 铸造函数，方便测试时给用户发代币
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // 批量转账，方便给多个用户发测试币
    function batchTransfer(
        address[] memory recipients,
        uint256 amount
    ) external onlyOwner {
        for (uint i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amount);
        }
    }
}
