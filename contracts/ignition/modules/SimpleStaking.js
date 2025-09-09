import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import YDTokenModule from "./YDToken.js";

export default buildModule("SimpleStakingModule", (m) => {
  // 导入YD代币合约 (不需要USDT了)
  const { ydToken } = m.useModule(YDTokenModule);

  // 部署质押合约，只传入YD代币地址
  const simpleStaking = m.contract("SimpleStaking", [ydToken]);

  // 给质押合约转账奖励代币 (50000 YD)
  const rewardAmount = "50000000000000000000000"; // 50000 * 10^18
  m.call(ydToken, "transfer", [simpleStaking, rewardAmount]);

  return { simpleStaking, ydToken };
});