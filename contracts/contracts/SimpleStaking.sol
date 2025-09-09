// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleStaking {
    IERC20 public ydToken;

    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public stakeTimestamp;

    // 简化奖励：每天1% (1% = 100/10000)
    uint256 public constant DAILY_REWARD_RATE = 100;
    uint256 public constant SECONDS_PER_DAY = 86400; // 24小时

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    constructor(address _ydToken) {
        ydToken = IERC20(_ydToken);
    }

    // 质押YD代币
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // 如果已有质押，先取出旧的
        if (stakedAmount[msg.sender] > 0) {
            unstake();
        }

        ydToken.transferFrom(msg.sender, address(this), amount);
        stakedAmount[msg.sender] = amount;
        stakeTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    // 取消质押并获得奖励
    function unstake() public {
        uint256 amount = stakedAmount[msg.sender];
        require(amount > 0, "No staked amount");

        // 计算奖励
        uint256 daysStaked = (block.timestamp - stakeTimestamp[msg.sender]) /
            SECONDS_PER_DAY;
        uint256 reward = (amount * DAILY_REWARD_RATE * daysStaked) / 10000;

        // 重置数据
        stakedAmount[msg.sender] = 0;
        stakeTimestamp[msg.sender] = 0;

        // 转账本金 + 奖励
        ydToken.transfer(msg.sender, amount + reward);

        emit Unstaked(msg.sender, amount, reward);
    }

    // 查看可获得的奖励
    function calculateReward(address user) external view returns (uint256) {
        if (stakedAmount[user] == 0) return 0;

        uint256 daysStaked = (block.timestamp - stakeTimestamp[user]) /
            SECONDS_PER_DAY;
        return (stakedAmount[user] * DAILY_REWARD_RATE * daysStaked) / 10000;
    }

    // 查看质押信息
    function getStakeInfo(
        address user
    )
        external
        view
        returns (uint256 amount, uint256 stakeTime, uint256 pendingReward)
    {
        amount = stakedAmount[user];
        stakeTime = stakeTimestamp[user];

        if (amount > 0) {
            uint256 daysStaked = (block.timestamp - stakeTime) /
                SECONDS_PER_DAY;
            pendingReward = (amount * DAILY_REWARD_RATE * daysStaked) / 10000;
        }
    }

    // 获取合约总质押量
    function getTotalStaked() external view returns (uint256) {
        return ydToken.balanceOf(address(this));
    }
}
