// scripts/deploy.js
async function main() {
  console.log("开始部署合约...");

  // 1. 部署YD代币
  const YDToken = await hre.ethers.getContractFactory("YDToken");
  const ydToken = await YDToken.deploy();
  await ydToken.deployed();
  console.log("✅ YDToken:", ydToken.address);

  // 2. 部署课程管理合约
  const CourseManager = await hre.ethers.getContractFactory("CourseManager");
  const courseManager = await CourseManager.deploy(ydToken.address);
  await courseManager.deployed();
  console.log("✅ CourseManager:", courseManager.address);

  // 3. 部署简化质押合约 (不需要USDT)
  const SimpleStaking = await hre.ethers.getContractFactory("SimpleStaking");
  const staking = await SimpleStaking.deploy(ydToken.address);
  await staking.deployed();
  console.log("✅ SimpleStaking:", staking.address);

  // 4. 给质押合约转一些YD作为奖励池
  const rewardAmount = hre.ethers.utils.parseEther("50000"); // 5万个YD作为奖励
  await ydToken.transfer(staking.address, rewardAmount);
  console.log("✅ 已转账5万YD到质押合约作为奖励池");

  console.log("\n🎉 部署完成! 合约地址:");
  console.log("YDToken:", ydToken.address);
  console.log("CourseManager:", courseManager.address);
  console.log("SimpleStaking:", staking.address);
}