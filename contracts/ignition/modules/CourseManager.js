import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import YDTokenModule from "./YDToken.js";

export default buildModule("CourseManagerModule", (m) => {
  // 导入YD代币合约
  const { ydToken } = m.useModule(YDTokenModule);

  // 部署课程管理合约，传入YD代币地址
  const courseManager = m.contract("CourseManager", [ydToken]);

  return { courseManager, ydToken };
});