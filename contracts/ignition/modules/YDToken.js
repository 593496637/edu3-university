import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("YDTokenModule", (m) => {
  // 部署YD代币合约
  const ydToken = m.contract("YDToken");

  return { ydToken };
});